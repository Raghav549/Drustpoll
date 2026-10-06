import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { AppShell } from '../src/ui/AppShell';
import { completeMediaUpload, createMediaUploadIntent, createPost, getDiscoveryResults, getMarketProducts, getMediaAssetStatus } from '../src/api/client';
import { Icon } from '../src/ui/icons';
import { colors, radius, spacing, type } from '../src/ui/theme';

const DRAFT_KEY='drustpoll.create.studio.v2';
type Kind='post'|'video'|'reel'|'poll'|'link'|'product'|'quote';
type Media={uri:string;type:'image'|'video';width?:number;height?:number;durationMs?:number;fileName?:string|null;mimeType?:string|null;fileSize?:number|null;assetId?:string};
type Draft={kind:Kind;caption:string;visibility:'public'|'followers'|'private';media:Media[];altText:string;warning:string;location:string;linkUrl:string;pollOptions:string[];allowComments:boolean;productId:string;productTitle:string;quotePostId:string;quoteCaption:string;quoteAuthor:string};
type PublishState='idle'|'saving'|'uploading'|'processing'|'publishing'|'success'|'error';
const blank:Draft={kind:'post',caption:'',visibility:'public',media:[],altText:'',warning:'',location:'',linkUrl:'',pollOptions:['',''],allowComments:true,productId:'',productTitle:'',quotePostId:'',quoteCaption:'',quoteAuthor:''};
const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const acceptedImages=new Set(['image/jpeg','image/png','image/webp']);
const acceptedVideos=new Set(['video/mp4','video/webm']);

function updateMedia(media:Media[],index:number,next:Partial<Media>){return media.map((item,i)=>i===index?{...item,...next}:item);}
function usableWebUrl(value:string){try{const url=new URL(value.trim());return url.protocol==='http:'||url.protocol==='https:';}catch{return false;}}

export default function Create(){
 const[d,setD]=useState<Draft>(blank);
 const[state,setState]=useState<PublishState>('idle');
 const[error,setError]=useState<string|null>(null);
 const[restored,setRestored]=useState(false);
 const[uploadProgress,setUploadProgress]=useState('');
 const[productQuery,setProductQuery]=useState('');
 const[productResults,setProductResults]=useState<any[]>([]);
 const[quoteQuery,setQuoteQuery]=useState('');
 const[quoteResults,setQuoteResults]=useState<any[]>([]);
 const[targetError,setTargetError]=useState<string|null>(null);
 const[searchingTarget,setSearchingTarget]=useState(false);

 useEffect(()=>{void AsyncStorage.getItem(DRAFT_KEY).then(raw=>{if(raw){try{setD({...blank,...JSON.parse(raw)});}catch{}}}).finally(()=>setRestored(true));},[]);
 useEffect(()=>{if(!restored||state==='success')return;const timer=setTimeout(()=>{void AsyncStorage.setItem(DRAFT_KEY,JSON.stringify(d));},350);return()=>clearTimeout(timer);},[d,restored,state]);
 useEffect(()=>{
  const term=productQuery.trim();if(d.kind!=='product'||!term){setProductResults([]);setSearchingTarget(false);return;}
  let live=true;const timer=setTimeout(()=>{setSearchingTarget(true);setTargetError(null);void getMarketProducts({q:term,limit:8,sort:'relevance'}).then(result=>{if(live)setProductResults(result.items??[]);}).catch(e=>{if(live)setTargetError(e instanceof Error?e.message:'Could not search products');}).finally(()=>{if(live)setSearchingTarget(false);});},250);
  return()=>{live=false;clearTimeout(timer);};
 },[productQuery,d.kind]);
 useEffect(()=>{
  const term=quoteQuery.trim();if(d.kind!=='quote'||!term){setQuoteResults([]);setSearchingTarget(false);return;}
  let live=true;const timer=setTimeout(()=>{setSearchingTarget(true);setTargetError(null);void getDiscoveryResults(term,'posts','relevance',8).then(result=>{if(live)setQuoteResults(result.posts??[]);}).catch(e=>{if(live)setTargetError(e instanceof Error?e.message:'Could not search posts');}).finally(()=>{if(live)setSearchingTarget(false);});},250);
  return()=>{live=false;clearTimeout(timer);};
 },[quoteQuery,d.kind]);

 const patch=(change:Partial<Draft>)=>{setD(value=>({...value,...change}));if(state==='error')setState('idle');};
 const pick=async(source:'library'|'camera')=>{
  setError(null);
  try{
   let result:ImagePicker.ImagePickerResult;
   if(source==='camera'){
    const permission=await ImagePicker.requestCameraPermissionsAsync();
    if(!permission.granted)throw new Error('Camera permission is required to capture media.');
    result=await ImagePicker.launchCameraAsync({mediaTypes:['images','videos'],quality:.9});
   }else{
    const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(!permission.granted)throw new Error('Photo library permission is required to choose media.');
    result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images','videos'],allowsMultipleSelection:true,selectionLimit:10,quality:.9});
   }
   if(result.canceled)return;
   const media:Media[]=result.assets.slice(0,10).map(asset=>({
    uri:asset.uri,
    type:asset.type==='video'?'video':'image',
    width:asset.width,
    height:asset.height,
    durationMs:asset.duration??undefined,
    fileName:asset.fileName,
    mimeType:asset.mimeType,
    fileSize:asset.fileSize,
   }));
   patch({media,kind:media.some(item=>item.type==='video')?'video':'post'});
  }catch(e){setError(e instanceof Error?e.message:'Could not select media');}
 };
 const cropFirst=async()=>{
  const item=d.media[0];if(!item||item.type!=='image')return;
  try{
   const result=await ImageManipulator.manipulateAsync(item.uri,[],{compress:.92,format:ImageManipulator.SaveFormat.JPEG});
   patch({media:[{...item,uri:result.uri,width:result.width,height:result.height,fileName:'cropped-image.jpg',mimeType:'image/jpeg',fileSize:null,assetId:undefined},...d.media.slice(1)]});
  }catch(e){setError(e instanceof Error?e.message:'Could not prepare image');}
 };

 const waitUntilReady=async(assetId:string)=>{
  for(let attempt=0;attempt<40;attempt++){
   const asset=await getMediaAssetStatus(assetId);
   if(asset.status==='ready'&&asset.moderation_status==='approved')return;
   if(['rejected','failed','deleted','blocked'].includes(asset.status)||['rejected','blocked'].includes(asset.moderation_status)){
    throw new Error('A selected media item did not pass the server safety checks. Remove it or choose different media.');
   }
   if(attempt<39)await delay(1500);
  }
  throw new Error('Media is still processing. Your draft is saved; try publishing again shortly.');
 };

 const prepareMedia=async(item:Media,index:number)=>{
  let assetId=item.assetId;
  if(assetId){
   const current=await getMediaAssetStatus(assetId);
   if(current.status==='ready'&&current.moderation_status==='approved')return assetId;
   if(['rejected','failed','deleted','blocked'].includes(current.status)||['rejected','blocked'].includes(current.moderation_status)){
    throw new Error(`Media ${index+1} was rejected by server checks. Remove it or choose another file.`);
   }
   if(current.status==='pending_upload'){
    const mime=item.type==='image'?(item.mimeType||'image/jpeg'):(item.mimeType||'video/mp4');
    setState('processing');setUploadProgress(`Verifying media ${index+1} of ${d.media.length}`);
    await completeMediaUpload(assetId,{mime,width:item.width,height:item.height,durationMs:item.durationMs});
   }
   setState('processing');setUploadProgress(`Waiting for media ${index+1} of ${d.media.length}`);
   await waitUntilReady(assetId);
   return assetId;
  }

  let uri=item.uri;
  let mime=(item.mimeType||'').toLowerCase();
  let filename=item.fileName||`drustpoll-${index+1}`;
  let sizeHint=item.fileSize;
  if(item.type==='image'&&!acceptedImages.has(mime)){
   const converted=await ImageManipulator.manipulateAsync(uri,[],{compress:.9,format:ImageManipulator.SaveFormat.JPEG});
   uri=converted.uri;mime='image/jpeg';filename=`drustpoll-${index+1}.jpg`;sizeHint=null;
  }
  if(item.type==='video'&&!acceptedVideos.has(mime)){
   throw new Error('This video format is not supported. Choose an MP4 or WebM video.');
  }
  const localResponse=await fetch(uri);
  if(!localResponse.ok)throw new Error(`Could not read selected media ${index+1}. Please choose it again.`);
  const blob=await localResponse.blob();
  const byteSize=Number(sizeHint)||blob.size;
  if(!Number.isSafeInteger(byteSize)||byteSize<=0)throw new Error(`Could not determine the size of media ${index+1}. Please choose it again.`);
  if(!mime)throw new Error(`Could not identify the file type for media ${index+1}. Please choose it again.`);
  const intent=await createMediaUploadIntent(item.type,mime,filename,byteSize);
  if(byteSize>intent.maxBytes)throw new Error(`Media ${index+1} exceeds the server size limit.`);
  setState('uploading');setUploadProgress(`Uploading media ${index+1} of ${d.media.length}`);
  const uploaded=await fetch(intent.uploadUrl,{method:'PUT',headers:{'Content-Type':mime},body:blob});
  if(!uploaded.ok)throw new Error(`Upload failed for media ${index+1}. Your local draft is preserved.`);
  assetId=intent.assetId;
  setD(value=>({...value,media:updateMedia(value.media,index,{assetId,mimeType:mime,fileName:filename,fileSize:byteSize})}));
  setState('processing');setUploadProgress(`Checking media ${index+1} of ${d.media.length}`);
  await completeMediaUpload(assetId,{mime,width:item.width,height:item.height,durationMs:item.durationMs});
  setUploadProgress(`Waiting for media ${index+1} of ${d.media.length}`);
  await waitUntilReady(assetId);
  return assetId;
 };

 const validationMessage=useMemo(()=>{
  if(d.kind==='link'&&!usableWebUrl(d.linkUrl))return'Add a valid http or https URL.';
  if(d.kind==='poll'&&(!d.caption.trim()||d.pollOptions.filter(value=>value.trim()).length<2))return'A poll needs a question and at least two options.';
  if(d.kind==='video'&&!d.media.some(item=>item.type==='video'))return'Choose at least one video for a video post.';
  if(d.kind==='reel'&&(d.media.length!==1||d.media[0]?.type!=='video'))return'A Reel needs exactly one video.';
  if(d.kind==='product'&&!d.productId)return'Search for and select a product to tag.';
  if(d.kind==='quote'&&!d.quotePostId)return'Search for and select a post to quote.';
  if(d.kind==='post'&&!d.caption.trim()&&!d.media.length)return'Add a caption or select media.';
  return null;
 },[d]);
 const canPublish=!validationMessage&&state!=='uploading'&&state!=='processing'&&state!=='publishing';

 const publish=async()=>{
  if(state==='uploading'||state==='processing'||state==='publishing')return;
  if(validationMessage){setError(validationMessage);setState('error');return;}
  setError(null);setUploadProgress('');
  try{
   const mediaAssetIds:string[]=[];
   for(let index=0;index<d.media.length;index++)mediaAssetIds.push(await prepareMedia(d.media[index],index));
   setState('publishing');setUploadProgress('Publishing your creation');
   await createPost({
    caption:d.caption.trim(),visibility:d.visibility,contentType:d.kind,altText:d.altText.trim(),contentWarning:d.warning.trim(),location:d.location.trim(),
    allowComments:d.allowComments,linkUrl:d.kind==='link'?d.linkUrl.trim():undefined,pollOptions:d.kind==='poll'?d.pollOptions:undefined,
    productId:d.kind==='product'?d.productId:undefined,quotePostId:d.kind==='quote'?d.quotePostId:undefined,mediaAssetIds,
   });
   await AsyncStorage.removeItem(DRAFT_KEY);setD(blank);setState('success');setUploadProgress('');
  }catch(e){setState('error');setError(e instanceof Error?e.message:'Could not publish. Your draft is preserved.');setUploadProgress('');}
 };
 const reset=async()=>{await AsyncStorage.removeItem(DRAFT_KEY);setD(blank);setState('idle');setError(null);setUploadProgress('');};
 const modes:Kind[]=['post','video','reel','poll','link','product','quote'];
 const label=(kind:Kind)=>({post:'Post',video:'Video',reel:'Reel',poll:'Poll',link:'Link',product:'Product',quote:'Quote'}[kind]);
 const targetSearch=async(value:string)=>{
  if(d.kind==='product')setProductQuery(value);
  else setQuoteQuery(value);
 };
 const formatPrice=(product:any)=>`${(Number(product.price_minor||0)/100).toFixed(2)} ${product.currency||''}`.trim();

 return <AppShell>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
   <Text style={styles.kicker}>CREATE STUDIO</Text>
   <View style={styles.titleRow}><View style={styles.copy}><Text style={styles.title}>Create, then choose what leaves your device.</Text><Text style={styles.sub}>Your draft stays local until you publish. Media is uploaded, checked and approved before it can be attached.</Text></View><Link href="/" asChild><Pressable accessibilityRole="button" accessibilityLabel="Close creator studio" style={styles.icon}><Icon name="close" size={20}/></Pressable></Link></View>
   {restored&&(d.caption||d.media.length||d.productId||d.quotePostId)?<View style={styles.draft}><Text style={styles.draftTitle}>Draft restored</Text><Text style={styles.draftBody}>Your unfinished creation was recovered.</Text><Pressable accessibilityRole="button" onPress={()=>void reset()}><Text style={styles.link}>Discard draft</Text></Pressable></View>:null}
   <View style={styles.modeRow} accessibilityRole="tablist">{modes.map(kind=><Pressable key={kind} accessibilityRole="tab" accessibilityState={{selected:d.kind===kind}} onPress={()=>patch({kind})} style={[styles.mode,d.kind===kind&&styles.modeActive]}><Icon name={kind==='reel'||kind==='video'?'video':kind==='poll'?'chart':kind==='link'?'link':kind==='product'?'cart':kind==='quote'?'quote':'create'} size={18} color={d.kind===kind?colors.brand:colors.muted}/><Text style={[styles.modeText,d.kind===kind&&styles.modeTextActive]}>{label(kind)}</Text></Pressable>)}</View>

   {(d.kind==='product'||d.kind==='quote')?<View style={styles.card}>
    <Text style={styles.section}>{d.kind==='product'?'Choose a product':'Choose a post to quote'}</Text>
    <Text style={styles.muted}>{d.kind==='product'?'Search the active Market catalogue, then tag the product in your post.':'Search public posts and choose the one you want to quote.'}</Text>
    {d.kind==='product'?<TextInput value={productQuery} onChangeText={targetSearch} placeholder="Search products" placeholderTextColor={colors.faint} accessibilityLabel="Search products to tag" style={styles.single}/>:<TextInput value={quoteQuery} onChangeText={targetSearch} placeholder="Search posts" placeholderTextColor={colors.faint} accessibilityLabel="Search posts to quote" style={styles.single}/>}
    {searchingTarget?<View style={styles.targetLoading}><ActivityIndicator size="small"/><Text style={styles.muted}>Searching…</Text></View>:null}
    {targetError?<Text accessibilityRole="alert" style={styles.inlineError}>{targetError}</Text>:null}
    {d.kind==='product'&&d.productId?<View style={styles.selectedTarget}><Icon name="cart" size={19} color={colors.commerce}/><View style={styles.targetCopy}><Text style={styles.targetTitle}>{d.productTitle||'Selected product'}</Text><Text style={styles.targetMeta}>{d.productId}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Remove product tag" onPress={()=>patch({productId:'',productTitle:''})} style={styles.targetRemove}><Icon name="close" size={17}/></Pressable></View>:null}
    {d.kind==='quote'&&d.quotePostId?<View style={styles.selectedTarget}><Icon name="quote" size={19} color={colors.brand}/><View style={styles.targetCopy}><Text numberOfLines={2} style={styles.targetTitle}>{d.quoteCaption||'Selected post'}</Text><Text style={styles.targetMeta}>@{d.quoteAuthor||'creator'} · {d.quotePostId}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Remove quoted post" onPress={()=>patch({quotePostId:'',quoteCaption:'',quoteAuthor:''})} style={styles.targetRemove}><Icon name="close" size={17}/></Pressable></View>:null}
    {d.kind==='product'&&!d.productId?productResults.map((product:any)=><Pressable key={product.id} accessibilityRole="button" onPress={()=>patch({productId:String(product.id),productTitle:String(product.title??'Product')})} style={styles.targetRow}><View style={styles.targetGlyph}><Icon name="shop" size={19} color={colors.commerce}/></View><View style={styles.targetCopy}><Text numberOfLines={1} style={styles.targetTitle}>{product.title}</Text><Text style={styles.targetMeta}>{product.shop_name||'Independent shop'} · {formatPrice(product)}</Text></View><Icon name="chevronRight" size={18} color={colors.faint}/></Pressable>):null}
    {d.kind==='quote'&&!d.quotePostId?quoteResults.map((post:any)=><Pressable key={post.id} accessibilityRole="button" onPress={()=>patch({quotePostId:String(post.id),quoteCaption:String(post.caption??post.title??'Post'),quoteAuthor:String(post.username??post.display_name??'creator')})} style={styles.targetRow}><View style={styles.targetGlyph}><Icon name="quote" size={19} color={colors.brand}/></View><View style={styles.targetCopy}><Text numberOfLines={2} style={styles.targetTitle}>{post.caption||post.title||'Post'}</Text><Text style={styles.targetMeta}>@{post.username||post.display_name||'creator'}</Text></View><Icon name="chevronRight" size={18} color={colors.faint}/></Pressable>):null}
   </View>:null}

   <View style={styles.card}>
    <Text style={styles.section}>Media</Text>
    <View style={styles.mediaActions}><Pressable accessibilityRole="button" onPress={()=>void pick('library')} style={styles.secondary}><Icon name="gallery" size={18}/><Text style={styles.secondaryText}>Gallery</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>void pick('camera')} style={styles.secondary}><Icon name="camera" size={18}/><Text style={styles.secondaryText}>Camera</Text></Pressable></View>
    {d.media.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaList}>{d.media.map((item,index)=><View key={`${item.uri}-${index}`} style={styles.thumb}>{item.type==='image'?<Image source={{uri:item.uri}} style={styles.image}/>:<View style={styles.videoThumb}><Icon name="video" size={30} color={colors.white}/><Text style={styles.videoText}>VIDEO</Text></View>}<Text style={styles.thumbLabel}>{index+1} / {d.media.length}{item.assetId?' · uploaded':''}</Text></View>)}</ScrollView>:<Text style={styles.muted}>Choose up to 10 photos or videos. Reels require one video clip.</Text>}
    {d.media[0]?.type==='image'?<Pressable accessibilityRole="button" onPress={()=>void cropFirst()} style={styles.quiet}><Icon name="crop" size={17}/><Text style={styles.quietText}>Prepare first image</Text></Pressable>:null}
   </View>

   <View style={styles.card}>
    <Text style={styles.section}>{d.kind==='poll'?'Poll question':'Caption'}</Text>
    <TextInput value={d.caption} onChangeText={value=>patch({caption:value})} placeholder={d.kind==='poll'?'Ask a clear question…':'Write with context, not pressure…'} placeholderTextColor={colors.faint} multiline maxLength={2200} accessibilityLabel={d.kind==='poll'?'Poll question':'Caption editor'} style={styles.input}/>
    <Text style={styles.counter}>{d.caption.length}/2200</Text>
    <Text style={styles.section}>Accessibility & context</Text>
    <TextInput value={d.altText} onChangeText={value=>patch({altText:value})} placeholder="Alt text for images (recommended)" placeholderTextColor={colors.faint} accessibilityLabel="Alternative text" style={styles.single}/>
    <TextInput value={d.warning} onChangeText={value=>patch({warning:value})} placeholder="Content warning (optional)" placeholderTextColor={colors.faint} accessibilityLabel="Content warning" style={styles.single}/>
   </View>

   {d.kind==='link'?<View style={styles.card}><Text style={styles.section}>Link</Text><TextInput value={d.linkUrl} onChangeText={value=>patch({linkUrl:value})} autoCapitalize="none" keyboardType="url" placeholder="https://…" placeholderTextColor={colors.faint} accessibilityLabel="Link URL" style={styles.single}/></View>:null}
   {d.kind==='poll'?<View style={styles.card}><Text style={styles.section}>Poll options</Text>{d.pollOptions.map((value,index)=><TextInput key={index} value={value} onChangeText={next=>patch({pollOptions:d.pollOptions.map((option,i)=>i===index?next:option)})} placeholder={`Option ${index+1}`} placeholderTextColor={colors.faint} accessibilityLabel={`Poll option ${index+1}`} style={styles.single}/>)}{d.pollOptions.length<6?<Pressable accessibilityRole="button" onPress={()=>patch({pollOptions:[...d.pollOptions,'']})} style={styles.quiet}><Icon name="add" size={17}/><Text style={styles.quietText}>Add option</Text></Pressable>:null}</View>:null}

   <View style={styles.card}>
    <Text style={styles.section}>Publishing controls</Text>
    <TextInput value={d.location} onChangeText={value=>patch({location:value})} placeholder="Location label (optional)" placeholderTextColor={colors.faint} accessibilityLabel="Location label" style={styles.single}/>
    <View style={styles.choices}>{(['public','followers','private'] as const).map(value=><Pressable key={value} accessibilityRole="radio" accessibilityState={{selected:d.visibility===value}} onPress={()=>patch({visibility:value})} style={[styles.choice,d.visibility===value&&styles.choiceActive]}><Text style={[styles.choiceText,d.visibility===value&&styles.choiceTextActive]}>{value==='public'?'Everyone':value==='followers'?'Followers':'Only you'}</Text></Pressable>)}</View>
    <Pressable accessibilityRole="switch" accessibilityState={{checked:d.allowComments}} onPress={()=>patch({allowComments:!d.allowComments})} style={styles.switch}><Icon name={d.allowComments?'check':'close'} size={17}/><Text style={styles.switchText}>Allow comments</Text></Pressable>
   </View>

   {validationMessage&&state!=='error'?<Text style={styles.validation}>{validationMessage}</Text>:null}
   {error?<View accessibilityRole="alert" style={styles.error}><Text style={styles.errorTitle}>Creation needs attention</Text><Text style={styles.errorBody}>{error}</Text><Text style={styles.errorHint}>Your draft remains saved. Fix the issue, then retry.</Text></View>:null}
   {state==='success'?<View style={styles.success}><Icon name="check" size={26} color={colors.success}/><Text style={styles.successTitle}>Published</Text><Text style={styles.successBody}>The server accepted your creation.</Text><Link href="/" asChild><Pressable accessibilityRole="button" style={styles.secondary}><Text style={styles.secondaryText}>Return Home</Text></Pressable></Link></View>:<>
    {uploadProgress?<Text accessibilityLiveRegion="polite" style={styles.progress}>{uploadProgress}</Text>:null}
    <Pressable accessibilityRole="button" accessibilityState={{disabled:!canPublish,busy:state==='uploading'||state==='processing'||state==='publishing'}} disabled={!canPublish} onPress={()=>void publish()} style={[styles.publish,!canPublish&&styles.disabled]}>{state==='uploading'||state==='processing'||state==='publishing'?<ActivityIndicator color={colors.white}/>:<><Icon name="send" size={19} color={colors.white}/><Text style={styles.publishText}>Publish {label(d.kind)}</Text></>}</Pressable>
    <Pressable accessibilityRole="button" disabled={state==='uploading'||state==='processing'||state==='publishing'} onPress={()=>void AsyncStorage.setItem(DRAFT_KEY,JSON.stringify(d)).then(()=>setState('saving'))} style={styles.quiet}><Icon name="save" size={17}/><Text style={styles.quietText}>{state==='saving'?'Draft saved':'Save draft now'}</Text></Pressable>
   </>}
   <View style={styles.trust}><Text style={styles.trustTitle}>Creator safety</Text><Text style={styles.trustBody}>Nothing is published until every selected asset is uploaded, processed and approved. Your chosen audience and moderation state stay explicit.</Text><Pressable accessibilityRole="link" onPress={()=>void Linking.openURL('https://github.com/Raghav549/Drustpoll')}><Text style={styles.link}>View product source</Text></Pressable></View>
  </ScrollView>
 </AppShell>;
}

const styles=StyleSheet.create({
 content:{padding:spacing.xl,gap:spacing.lg,maxWidth:820,width:'100%',alignSelf:'center'},
 kicker:{fontSize:type.labelSM,fontWeight:'800',letterSpacing:1.8,color:colors.brand},
 titleRow:{flexDirection:'row',gap:12,alignItems:'flex-start'},copy:{flex:1},title:{fontSize:type.displayLG,lineHeight:38,fontWeight:'800',color:colors.ink},sub:{fontSize:type.bodySM,lineHeight:21,color:colors.muted,marginTop:5},
 icon:{width:44,height:44,borderRadius:radius.md,borderWidth:1,borderColor:colors.line,alignItems:'center',justifyContent:'center'},
 draft:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.warningSoft,borderWidth:1,borderColor:'#EAD8A1'},draftTitle:{fontWeight:'800',color:colors.ink},draftBody:{fontSize:type.bodySM,color:colors.inkSoft,marginTop:3},link:{color:colors.brand,fontWeight:'800',marginTop:8},
 modeRow:{flexDirection:'row',gap:8,flexWrap:'wrap'},mode:{minHeight:46,paddingHorizontal:13,borderRadius:radius.pill,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,flexDirection:'row',alignItems:'center',gap:6},modeActive:{backgroundColor:colors.brandSoft,borderColor:colors.brand},modeText:{fontSize:type.labelMD,fontWeight:'700',color:colors.muted},modeTextActive:{color:colors.brand},
 card:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line,borderRadius:radius.hero,padding:spacing.xl,gap:10},section:{fontSize:type.titleMD,fontWeight:'800',color:colors.ink},muted:{fontSize:type.bodySM,lineHeight:21,color:colors.muted},
 targetLoading:{minHeight:36,flexDirection:'row',alignItems:'center',gap:8},targetRow:{minHeight:62,padding:10,borderRadius:radius.md,borderWidth:1,borderColor:colors.line,backgroundColor:colors.canvas,flexDirection:'row',alignItems:'center',gap:10},targetGlyph:{width:40,height:40,borderRadius:12,backgroundColor:colors.commerceSoft,alignItems:'center',justifyContent:'center'},targetCopy:{flex:1,minWidth:0},targetTitle:{fontSize:type.bodySM,fontWeight:'800',color:colors.ink},targetMeta:{fontSize:type.labelSM,color:colors.muted,marginTop:3},selectedTarget:{minHeight:64,padding:10,borderRadius:radius.md,backgroundColor:colors.brandSoft,flexDirection:'row',alignItems:'center',gap:10},targetRemove:{width:40,height:40,borderRadius:12,alignItems:'center',justifyContent:'center'},inlineError:{color:colors.danger,fontSize:type.bodySM},
 mediaActions:{flexDirection:'row',gap:8,flexWrap:'wrap'},secondary:{minHeight:46,paddingHorizontal:15,borderRadius:radius.md,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:7},secondaryText:{fontWeight:'800',color:colors.ink},mediaList:{gap:10,paddingVertical:8},thumb:{width:150,height:150,borderRadius:radius.lg,overflow:'hidden',backgroundColor:colors.surfaceStrong,position:'relative'},image:{width:'100%',height:'100%'},videoThumb:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.brand},videoText:{color:colors.white,fontWeight:'800',fontSize:10,marginTop:5},thumbLabel:{position:'absolute',left:8,bottom:8,color:colors.white,fontWeight:'800',fontSize:11,backgroundColor:colors.scrim,paddingHorizontal:6,paddingVertical:3,borderRadius:radius.sm},
 quiet:{alignSelf:'flex-start',minHeight:42,paddingHorizontal:12,borderRadius:radius.md,backgroundColor:colors.brandSoft,flexDirection:'row',alignItems:'center',gap:7,justifyContent:'center'},quietText:{fontWeight:'800',color:colors.brand},input:{minHeight:170,borderWidth:1,borderColor:colors.line,borderRadius:radius.lg,padding:spacing.lg,color:colors.ink,fontSize:type.bodyMD,lineHeight:23,textAlignVertical:'top'},single:{minHeight:48,borderWidth:1,borderColor:colors.line,borderRadius:radius.md,paddingHorizontal:14,color:colors.ink,fontSize:type.bodyMD},counter:{textAlign:'right',fontSize:type.labelSM,color:colors.faint},
 choices:{flexDirection:'row',gap:8,flexWrap:'wrap'},choice:{minHeight:44,paddingHorizontal:14,borderRadius:radius.pill,borderWidth:1,borderColor:colors.line,justifyContent:'center'},choiceActive:{backgroundColor:colors.brandSoft,borderColor:colors.brand},choiceText:{color:colors.muted,fontWeight:'700'},choiceTextActive:{color:colors.brand},switch:{minHeight:48,flexDirection:'row',alignItems:'center',gap:8},switchText:{fontWeight:'800',color:colors.ink},
 validation:{padding:spacing.md,borderRadius:radius.md,backgroundColor:colors.warningSoft,color:colors.inkSoft,fontSize:type.bodySM},progress:{textAlign:'center',fontSize:type.bodySM,fontWeight:'800',color:colors.brand},publish:{minHeight:54,borderRadius:radius.md,backgroundColor:colors.brand,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},publishText:{color:colors.white,fontWeight:'800',fontSize:type.bodyMD},disabled:{opacity:.45},
 error:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.dangerSoft,borderWidth:1,borderColor:colors.danger},errorTitle:{fontWeight:'800',color:colors.danger},errorBody:{color:colors.inkSoft,marginTop:4},errorHint:{fontSize:type.bodySM,color:colors.muted,marginTop:5},success:{padding:spacing.xl,borderRadius:radius.lg,backgroundColor:colors.successSoft,borderWidth:1,borderColor:'#CFE9D9',gap:7},successTitle:{fontSize:type.titleMD,fontWeight:'800',color:colors.ink},successBody:{color:colors.inkSoft},trust:{padding:spacing.xl,borderRadius:radius.lg,backgroundColor:colors.infoSoft},trustTitle:{fontSize:type.titleMD,fontWeight:'800',color:colors.ink},trustBody:{fontSize:type.bodySM,lineHeight:21,color:colors.inkSoft},
});
