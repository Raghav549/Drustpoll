import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { AppShell } from '../src/ui/AppShell';
import { completeMediaUpload, createMediaUploadIntent, createSellerProduct, getMediaAssetStatus, getSellerProducts, type SellerProduct } from '../src/api/client';
import { Icon } from '../src/ui/icons';
import { colors, elevation, radius, spacing, type } from '../src/ui/theme';

const DRAFT_KEY='drustpoll.seller.product-draft.v1';
const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const acceptedImages=new Set(['image/jpeg','image/png','image/webp']);
const acceptedVideos=new Set(['video/mp4','video/webm']);
type ProductMedia={uri:string;type:'image'|'video';width?:number;height?:number;durationMs?:number;fileName?:string|null;mimeType?:string|null;fileSize?:number|null;assetId?:string};
type ProductDraft={title:string;description:string;price:string;inventory:string;category:string;media:ProductMedia[]};
const emptyDraft:ProductDraft={title:'',description:'',price:'',inventory:'',category:'',media:[]};

export default function Seller(){
 const[draft,setDraft]=useState<ProductDraft>(emptyDraft);
 const[products,setProducts]=useState<SellerProduct[]>([]);
 const[loading,setLoading]=useState(true);
 const[restored,setRestored]=useState(false);
 const[error,setError]=useState<string|null>(null);
 const[busy,setBusy]=useState(false);
 const[success,setSuccess]=useState(false);
 const[progress,setProgress]=useState('');

 const load=useCallback(async()=>{setLoading(true);setError(null);try{setProducts((await getSellerProducts()).products??[]);}catch(e){setError(e instanceof Error?e.message:'Could not load catalogue');}finally{setLoading(false);}},[]);
 useEffect(()=>{void load();},[load]);
 useEffect(()=>{void AsyncStorage.getItem(DRAFT_KEY).then(raw=>{if(raw){try{setDraft({...emptyDraft,...JSON.parse(raw)});}catch{}}}).finally(()=>setRestored(true));},[]);
 useEffect(()=>{if(!restored||success)return;const timer=setTimeout(()=>{void AsyncStorage.setItem(DRAFT_KEY,JSON.stringify(draft));},350);return()=>clearTimeout(timer);},[draft,restored,success]);
 const patch=(change:Partial<ProductDraft>)=>{setDraft(current=>({...current,...change}));setSuccess(false);if(error)setError(null);};

 const pickMedia=async()=>{
  if(busy)return;
  setError(null);
  try{
   const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
   if(!permission.granted)throw new Error('Photo library permission is required to choose product media.');
   const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images','videos'],allowsMultipleSelection:true,selectionLimit:8,quality:.9});
   if(result.canceled)return;
   const media:ProductMedia[]=result.assets.slice(0,8).map(asset=>({uri:asset.uri,type:asset.type==='video'?'video':'image',width:asset.width,height:asset.height,durationMs:asset.duration??undefined,fileName:asset.fileName,mimeType:asset.mimeType,fileSize:asset.fileSize}));
   patch({media});
  }catch(e){setError(e instanceof Error?e.message:'Could not select product media');}
 };
 const removeMedia=(index:number)=>patch({media:draft.media.filter((_,i)=>i!==index)});

 const waitUntilReady=async(assetId:string,index:number,total:number)=>{
  for(let attempt=0;attempt<40;attempt++){
   const asset=await getMediaAssetStatus(assetId);
   if(asset.status==='ready'&&asset.moderation_status==='approved')return;
   if(['rejected','failed','deleted','blocked'].includes(asset.status)||['rejected','blocked'].includes(asset.moderation_status))throw new Error(`Product media ${index+1} did not pass server safety checks. Remove it or choose a different file.`);
   setProgress(`Checking product media ${index+1} of ${total}…`);
   if(attempt<39)await delay(1500);
  }
  throw new Error('Media is still processing. Your product draft has been saved; try publishing again shortly.');
 };
 const prepareMedia=async(item:ProductMedia,index:number,total:number):Promise<string>=>{
  let assetId=item.assetId;
  if(assetId){
   const current=await getMediaAssetStatus(assetId);
   if(current.status==='ready'&&current.moderation_status==='approved')return assetId;
   if(['rejected','failed','deleted','blocked'].includes(current.status)||['rejected','blocked'].includes(current.moderation_status))throw new Error(`Product media ${index+1} was rejected. Remove it or choose another file.`);
   if(current.status==='pending_upload')await completeMediaUpload(assetId,{mime:item.mimeType||(item.type==='image'?'image/jpeg':'video/mp4'),width:item.width,height:item.height,durationMs:item.durationMs});
   await waitUntilReady(assetId,index,total);
   return assetId;
  }

  let uri=item.uri;
  let mime=(item.mimeType||'').toLowerCase();
  let filename=item.fileName||`drustpoll-product-${index+1}`;
  let sizeHint=item.fileSize;
  if(item.type==='image'&&!acceptedImages.has(mime)){
   const converted=await ImageManipulator.manipulateAsync(uri,[],{compress:.9,format:ImageManipulator.SaveFormat.JPEG});
   uri=converted.uri;mime='image/jpeg';filename=`drustpoll-product-${index+1}.jpg`;sizeHint=null;
  }
  if(item.type==='video'&&!acceptedVideos.has(mime))throw new Error('This video format is not supported. Choose an MP4 or WebM video.');
  const localResponse=await fetch(uri);
  if(!localResponse.ok)throw new Error(`Could not read product media ${index+1}. Please select it again.`);
  const blob=await localResponse.blob();
  const byteSize=Number(sizeHint)||blob.size;
  if(!Number.isSafeInteger(byteSize)||byteSize<=0)throw new Error(`Could not determine the size of product media ${index+1}.`);
  if(!mime)throw new Error(`Could not identify product media ${index+1}. Please select it again.`);
  const intent=await createMediaUploadIntent(item.type,mime,filename,byteSize);
  if(byteSize>intent.maxBytes)throw new Error(`Product media ${index+1} exceeds the server size limit.`);
  setProgress(`Uploading product media ${index+1} of ${total}…`);
  const uploaded=await fetch(intent.uploadUrl,{method:'PUT',headers:{'Content-Type':mime},body:blob});
  if(!uploaded.ok)throw new Error(`Upload failed for product media ${index+1}. Your local draft is preserved.`);
  assetId=intent.assetId;
  setDraft(current=>({...current,media:current.media.map((media,i)=>i===index?{...media,assetId,mimeType:mime,fileName:filename,fileSize:byteSize}:media)}));
  setProgress(`Processing product media ${index+1} of ${total}…`);
  await completeMediaUpload(assetId,{mime,width:item.width,height:item.height,durationMs:item.durationMs});
  await waitUntilReady(assetId,index,total);
  return assetId;
 };

 const create=async()=>{
  if(busy)return;
  const priceMinor=Math.round(Number(draft.price)*100),stock=Number(draft.inventory);
  if(!draft.title.trim())return setError('Add a product title.');
  if(!Number.isSafeInteger(priceMinor)||priceMinor<0)return setError('Enter a valid price.');
  if(!Number.isSafeInteger(stock)||stock<0)return setError('Enter a valid inventory count.');
  setBusy(true);setError(null);setSuccess(false);setProgress('Preparing product media…');
  try{
   const mediaAssetIds:string[]=[];
   for(let index=0;index<draft.media.length;index++)mediaAssetIds.push(await prepareMedia(draft.media[index],index,draft.media.length));
   setProgress('Publishing product…');
   await createSellerProduct({title:draft.title.trim(),description:draft.description.trim(),priceMinor,inventory:stock,category:draft.category.trim()||undefined,mediaAssetIds});
   await AsyncStorage.removeItem(DRAFT_KEY);
   setDraft(emptyDraft);setSuccess(true);setProgress('');
   await load();
  }catch(e){setError(e instanceof Error?e.message:'Could not create product. Your draft is preserved.');setProgress('');}
  finally{setBusy(false);}
 };

 return <AppShell><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
  <View style={styles.top}><View style={styles.titleCopy}><Text style={styles.kicker}>MARKET / SELLER</Text><Text style={styles.title}>Your storefront.</Text><Text style={styles.subtitle}>Create a considered listing with clear pricing, availability and approved media. Nothing implies a sale until the server accepts the product.</Text></View><Link href="/shop" asChild><Pressable accessibilityRole="button" style={styles.marketLink}><Icon name="shop" size={16} color={colors.commerce}/><Text style={styles.marketLinkText}>Market</Text></Pressable></Link></View>
  {restored&&(draft.title||draft.description||draft.media.length)?<View style={styles.draft}><Icon name="save" size={18} color={colors.warning}/><View style={styles.draftCopy}><Text style={styles.draftTitle}>Draft restored</Text><Text style={styles.meta}>Your unfinished listing was recovered on this device.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Discard product draft" disabled={busy} onPress={()=>{setDraft(emptyDraft);setError(null);void AsyncStorage.removeItem(DRAFT_KEY);}} style={styles.remove}><Icon name="close" size={17} color={colors.muted}/></Pressable></View>:null}
  {error?<View accessibilityRole="alert" style={styles.alert}><Icon name="circleAlert" size={19} color={colors.danger}/><View style={styles.flex}><Text style={styles.alertTitle}>Catalogue needs attention</Text><Text style={styles.alertBody}>{error}</Text></View></View>:null}
  {success?<View style={styles.success}><Icon name="check" size={20} color={colors.success}/><View><Text style={styles.successTitle}>Product created.</Text><Text style={styles.successBody}>Your catalogue is updated from the server.</Text></View></View>:null}
  <View style={styles.form}>
   <Text style={styles.heading}>New product</Text>
   <Field label="Title" value={draft.title} onChangeText={value=>patch({title:value})} placeholder="What are you selling?" editable={!busy}/>
   <Field label="Description" value={draft.description} onChangeText={value=>patch({description:value})} placeholder="Useful product details" multiline editable={!busy}/>
   <View style={styles.row}><View style={styles.half}><Field label="Price" value={draft.price} onChangeText={value=>patch({price:value})} placeholder="0.00" keyboardType="decimal-pad" editable={!busy}/></View><View style={styles.half}><Field label="Inventory" value={draft.inventory} onChangeText={value=>patch({inventory:value})} placeholder="0" keyboardType="number-pad" editable={!busy}/></View></View>
   <Field label="Category" value={draft.category} onChangeText={value=>patch({category:value})} placeholder="e.g. clothing" editable={!busy}/>
   <View style={styles.mediaHeader}><View style={styles.flex}><Text style={styles.fieldLabel}>Product media</Text><Text style={styles.meta}>Up to 8 images or videos. Each item is checked before it appears in your listing.</Text></View><Pressable accessibilityRole="button" accessibilityState={{disabled:busy}} disabled={busy} onPress={()=>void pickMedia()} style={styles.mediaButton}><Icon name="gallery" size={16} color={colors.commerce}/><Text style={styles.mediaButtonText}>{draft.media.length?'Choose again':'Add media'}</Text></Pressable></View>
   {draft.media.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaList}>{draft.media.map((item,index)=><View key={`${item.uri}-${index}`} style={styles.mediaTile}>{item.type==='image'?<Image source={{uri:item.uri}} style={styles.mediaImage} accessibilityLabel={`Product image ${index+1}`}/>:<View style={styles.videoTile}><Icon name="video" size={28} color={colors.white}/><Text style={styles.videoTileText}>VIDEO</Text></View>}<View style={styles.mediaBadge}><Text style={styles.mediaBadgeText}>{item.assetId?'UPLOADED':item.type.toUpperCase()}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Remove product media ${index+1}`} disabled={busy} onPress={()=>removeMedia(index)} style={styles.removeMedia}><Icon name="close" size={16} color={colors.ink}/></Pressable></View>)}</ScrollView>:<View style={styles.mediaEmpty}><Icon name="image" size={22} color={colors.commerce}/><Text style={styles.meta}>Listings work best with clear, well-lit product photos.</Text></View>}
   {progress?<Text accessibilityLiveRegion="polite" style={styles.progress}>{progress}</Text>:null}
   <Pressable accessibilityRole="button" accessibilityState={{disabled:busy,busy}} disabled={busy} onPress={()=>void create()} style={[styles.primary,busy&&styles.disabled]}>{busy?<ActivityIndicator color={colors.white}/>:<><Icon name="check" size={18} color={colors.white}/><Text style={styles.primaryText}>Publish product</Text></>}</Pressable>
  </View>
  <View style={styles.catalogueHead}><View><Text style={styles.heading}>Catalogue</Text><Text style={styles.meta}>Your live listings and current stock.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Refresh catalogue" disabled={loading} onPress={()=>void load()} style={styles.refresh}>{loading?<ActivityIndicator size="small"/>:<Icon name="refresh" size={18} color={colors.brand}/>}</Pressable></View>
  {loading&&!products.length?<View style={styles.center}><ActivityIndicator/><Text style={styles.meta}>Loading catalogue…</Text></View>:products.length?<View style={styles.list}>{products.map(product=><View key={product.id} style={styles.product}><View style={styles.productGlyph}><Icon name="shop" size={18} color={colors.commerce}/></View><View style={styles.productCopy}><Text style={styles.productTitle}>{product.title}</Text><Text style={styles.meta}>{product.category||'Uncategorised'} · {product.inventory} in stock · {product.status}</Text></View><Text style={styles.priceText}>{(product.price_minor/100).toFixed(2)} {product.currency}</Text></View>)}</View>:<View style={styles.empty}><Icon name="shop" size={25} color={colors.faint}/><Text style={styles.emptyTitle}>No products yet.</Text><Text style={styles.emptyBody}>Start with one clear product and let the catalogue grow from there.</Text></View>}
  <View style={styles.note}><Text style={styles.noteKicker}>COMMERCE PRINCIPLE</Text><Text style={styles.noteTitle}>Confidence before conversion.</Text><Text style={styles.noteBody}>Seller identity, price, availability and payment state remain explicit. The interface never manufactures urgency or fake demand.</Text></View>
 </ScrollView></AppShell>;
}

function Field({label,value,onChangeText,placeholder,multiline=false,keyboardType='default',editable=true}:{label:string;value:string;onChangeText:(v:string)=>void;placeholder:string;multiline?:boolean;keyboardType?:'default'|'decimal-pad'|'number-pad';editable?:boolean}){return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.faint} multiline={multiline} keyboardType={keyboardType} editable={editable} maxLength={multiline?10000:200} style={[styles.input,multiline&&styles.textarea]}/></View>}

const styles=StyleSheet.create({
 content:{padding:spacing.xl,gap:spacing.lg,maxWidth:840,width:'100%',alignSelf:'center'},top:{flexDirection:'row',alignItems:'flex-start',gap:12},titleCopy:{flex:1},kicker:{fontSize:type.labelSM,fontWeight:'900',letterSpacing:1.7,color:colors.commerce},title:{fontSize:type.displayLG,lineHeight:39,fontWeight:'900',color:colors.ink},subtitle:{fontSize:type.bodySM,lineHeight:21,color:colors.muted,marginTop:5},marketLink:{minHeight:44,paddingHorizontal:12,borderWidth:1,borderColor:colors.line,borderRadius:radius.md,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},marketLinkText:{fontWeight:'800',color:colors.ink},
 draft:{padding:spacing.md,borderRadius:radius.lg,backgroundColor:colors.warningSoft,borderWidth:1,borderColor:'#EAD8A1',flexDirection:'row',alignItems:'center',gap:10},draftCopy:{flex:1},draftTitle:{fontWeight:'900',color:colors.ink},remove:{width:40,height:40,alignItems:'center',justifyContent:'center'},alert:{padding:spacing.lg,borderWidth:1,borderColor:colors.danger,borderRadius:radius.lg,backgroundColor:colors.dangerSoft,flexDirection:'row',alignItems:'flex-start',gap:10},alertTitle:{fontWeight:'900',color:colors.danger},alertBody:{color:colors.inkSoft,marginTop:3},success:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.successSoft,borderWidth:1,borderColor:'#CFE9D9',flexDirection:'row',alignItems:'center',gap:10},successTitle:{fontWeight:'900',color:colors.ink},successBody:{fontSize:type.bodySM,color:colors.inkSoft,marginTop:3},
 form:{padding:spacing.xl,borderWidth:1,borderColor:colors.line,borderRadius:radius.hero,backgroundColor:colors.surface,...elevation.low},heading:{fontSize:type.titleMD,fontWeight:'900',color:colors.ink},field:{gap:6,marginTop:14},fieldLabel:{fontSize:type.labelMD,fontWeight:'900',color:colors.ink},input:{minHeight:48,borderWidth:1,borderColor:colors.line,borderRadius:radius.md,paddingHorizontal:14,color:colors.ink,fontSize:type.bodyMD,backgroundColor:colors.canvas},textarea:{minHeight:110,paddingTop:12,textAlignVertical:'top'},row:{flexDirection:'row',gap:12},half:{flex:1},flex:{flex:1},meta:{fontSize:type.labelSM,lineHeight:18,color:colors.muted,marginTop:3},mediaHeader:{marginTop:16,flexDirection:'row',alignItems:'center',gap:10},mediaButton:{minHeight:42,paddingHorizontal:12,borderRadius:radius.md,backgroundColor:colors.commerceSoft,borderWidth:1,borderColor:'#EBD2BB',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},mediaButtonText:{fontWeight:'900',color:colors.commerce},mediaList:{gap:10,paddingVertical:12},mediaTile:{width:142,height:142,borderRadius:radius.lg,overflow:'hidden',backgroundColor:colors.surfaceStrong,position:'relative'},mediaImage:{width:'100%',height:'100%',resizeMode:'cover'},videoTile:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.brand},videoTileText:{fontSize:type.labelSM,fontWeight:'900',color:colors.white,marginTop:5},mediaBadge:{position:'absolute',left:7,bottom:7,paddingHorizontal:7,paddingVertical:4,borderRadius:radius.sm,backgroundColor:colors.scrim},mediaBadgeText:{fontSize:9,fontWeight:'900',color:colors.white},removeMedia:{position:'absolute',right:6,top:6,width:34,height:34,borderRadius:17,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface},mediaEmpty:{minHeight:58,marginTop:12,padding:12,borderRadius:radius.md,backgroundColor:colors.commerceSoft,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8},progress:{marginTop:10,textAlign:'center',fontSize:type.bodySM,fontWeight:'800',color:colors.brand},primary:{marginTop:18,minHeight:50,borderRadius:radius.md,backgroundColor:colors.commerce,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:7},primaryText:{color:colors.white,fontWeight:'900',fontSize:type.bodyMD},disabled:{opacity:.5},
 catalogueHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},refresh:{width:44,height:44,borderRadius:radius.md,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'},center:{minHeight:140,alignItems:'center',justifyContent:'center',gap:8},list:{borderWidth:1,borderColor:colors.line,borderRadius:radius.lg,overflow:'hidden',backgroundColor:colors.surface},product:{minHeight:78,padding:spacing.md,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:1,borderBottomColor:colors.line},productGlyph:{width:42,height:42,borderRadius:13,backgroundColor:colors.commerceSoft,alignItems:'center',justifyContent:'center'},productCopy:{flex:1},productTitle:{fontSize:type.bodyMD,fontWeight:'900',color:colors.ink},priceText:{fontSize:type.bodyMD,fontWeight:'900',color:colors.commerce},empty:{padding:spacing.xl,borderRadius:radius.lg,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,alignItems:'center',gap:5},emptyTitle:{fontSize:type.titleMD,fontWeight:'900',color:colors.ink},emptyBody:{fontSize:type.bodySM,lineHeight:21,color:colors.muted,textAlign:'center',marginTop:3},note:{padding:spacing.xl,borderRadius:radius.lg,backgroundColor:colors.commerceSoft},noteKicker:{fontSize:type.labelSM,fontWeight:'900',letterSpacing:1.5,color:colors.commerce},noteTitle:{fontSize:type.titleMD,fontWeight:'900',color:colors.ink,marginTop:4},noteBody:{fontSize:type.bodySM,lineHeight:21,color:colors.inkSoft,marginTop:5},
});
