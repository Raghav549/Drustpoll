import { useCallback,useEffect,useState } from 'react';
import { ActivityIndicator,Image,Pressable,ScrollView,StyleSheet,Text,View } from 'react-native';
import { Link,useLocalSearchParams,useRouter } from 'expo-router';
import { AppShell } from '../src/ui/AppShell';
import { getProfileSurface,getProfilePosts,followUser,unfollowUser,type ProfileSurface,type FeedPost } from '../src/api/client';
import { PostMedia } from '../src/ui/PostMedia';
import { Icon } from '../src/ui/icons';
import { colors,elevation,radius,spacing,type } from '../src/ui/theme';

export default function ProfileView(){
 const router=useRouter();
 const params=useLocalSearchParams<{id?:string}>();
 const id=Array.isArray(params.id)?params.id[0]:params.id;
 const[data,setData]=useState<ProfileSurface|null>(null);
 const[posts,setPosts]=useState<FeedPost[]>([]);
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState<string|null>(null);
 const[postsError,setPostsError]=useState<string|null>(null);
 const[followBusy,setFollowBusy]=useState(false);
 const[following,setFollowing]=useState(false);
 const[requested,setRequested]=useState(false);

 const load=useCallback(async()=>{
  if(!id){setError('Profile unavailable');setLoading(false);return;}
  setLoading(true);setError(null);setPostsError(null);
  try{
   const result=await getProfileSurface(id);
   setData(result.profile);setFollowing(Boolean(result.profile.following));setRequested(Boolean(result.profile.requested));
   try{const page=await getProfilePosts(id,20);setPosts(page.posts??[]);}catch(e){setPosts([]);setPostsError(e instanceof Error?e.message:'Posts are not available for this profile.');}
  }catch(e){setError(e instanceof Error?e.message:'Could not load profile');}
  finally{setLoading(false);}
 },[id]);
 useEffect(()=>{void load();},[load]);

 const toggle=async()=>{
  if(!data||followBusy)return;
  setFollowBusy(true);setError(null);
  try{
   if(following){await unfollowUser(data.user_id);setFollowing(false);setRequested(false);}
   else{const result=await followUser(data.user_id);setFollowing(result.state==='following');setRequested(result.state==='requested');}
  }catch(e){setError(e instanceof Error?e.message:'Could not update relationship');}
  finally{setFollowBusy(false);}
 };

 if(loading)return <AppShell><View style={styles.center}><ActivityIndicator/><Text style={styles.muted}>Opening profile…</Text></View></AppShell>;
 if(error||!data)return <AppShell><View style={styles.center}><View style={styles.stateGlyph}><Icon name="profile" size={24} color={colors.brand}/></View><Text style={styles.errorTitle}>We couldn’t open this profile.</Text><Text style={styles.muted}>{error||'Profile not found.'}</Text><Pressable accessibilityRole="button" onPress={()=>void load()} style={styles.primary}><Text style={styles.primaryText}>Try again</Text><Icon name="refresh" size={16} color={colors.white}/></Pressable></View></AppShell>;

 return <AppShell><ScrollView contentContainerStyle={styles.content}>
  <View style={styles.top}><Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={()=>router.back()} style={styles.icon}><Icon name="back" size={21} color={colors.ink}/></Pressable><Text style={styles.kicker}>PROFILE</Text><View style={styles.spacer}/></View>
  <View style={styles.hero}>
   <View style={styles.heroTop}>{data.avatar_url?<Image source={{uri:data.avatar_url}} style={styles.avatarImage} accessibilityLabel={`${data.display_name||data.username} profile photo`}/>:<View style={styles.avatar}><Text style={styles.avatarText}>{(data.display_name||data.username||'D').slice(0,1).toUpperCase()}</Text></View>}
    <Pressable disabled={followBusy} onPress={()=>void toggle()} accessibilityRole="button" accessibilityState={{busy:followBusy,selected:following,disabled:followBusy}} style={[styles.follow,(following||requested)&&styles.followSecondary,followBusy&&styles.disabled]}>{followBusy?<ActivityIndicator color={colors.white}/>:<Text style={[styles.followText,(following||requested)&&styles.followTextSecondary]}>{following?'Following':requested?'Requested':'Follow'}</Text>}</Pressable>
   </View>
   <Text style={styles.name}>{data.display_name||data.username}</Text><Text style={styles.handle}>@{data.username}</Text>
   {data.bio?<Text style={styles.bio}>{data.bio}</Text>:<Text style={styles.bioMuted}>No bio yet.</Text>}
   {data.verified?<View style={styles.verified}><Icon name="check" size={13} color={colors.white}/><Text style={styles.verifiedText}>{data.verification_label||'Verified'}</Text></View>:null}
   <View style={styles.rule}/>
   <View style={styles.stats}><Stat label="Posts" value={data.post_count}/><Link href={{pathname:'/profile-list',params:{id:data.user_id,kind:'followers'}}} asChild><Pressable accessibilityRole="link" style={styles.stat}><Text style={styles.statValue}>{data.follower_count}</Text><Text style={styles.statLabel}>Followers</Text></Pressable></Link><Link href={{pathname:'/profile-list',params:{id:data.user_id,kind:'following'}}} asChild><Pressable accessibilityRole="link" style={styles.stat}><Text style={styles.statValue}>{data.following_count}</Text><Text style={styles.statLabel}>Following</Text></Pressable></Link></View>
  </View>
  {error?<View accessibilityRole="alert" style={styles.inlineError}><Icon name="circleAlert" size={16} color={colors.danger}/><Text style={styles.inlineErrorText}>{error}</Text></View>:null}
  <View style={styles.info}><View style={styles.infoGlyph}><Icon name="shield" size={18} color={colors.brand}/></View><View style={styles.infoCopy}><Text style={styles.infoTitle}>{data.profile_visibility==='private'?'Private profile':'Privacy-aware profile'}</Text><Text style={styles.infoBody}>Discovery and interactions respect this account’s visibility and relationship boundaries.</Text></View></View>
  <View style={styles.postsHead}><View><Text style={styles.postsTitle}>Posts</Text><Text style={styles.postsSubtitle}>Shared by @{data.username}</Text></View><Icon name="image" size={20} color={colors.brand}/></View>
  {postsError?<View accessibilityRole="alert" style={styles.postError}><Text style={styles.muted}>{postsError}</Text></View>:posts.length?posts.map(post=><View key={post.id} style={styles.postCard}><View style={styles.postByline}><View style={styles.miniAvatar}><Text style={styles.miniAvatarText}>{(data.display_name||data.username||'D').slice(0,1).toUpperCase()}</Text></View><View style={styles.postBylineCopy}><Text style={styles.postName}>{data.display_name||data.username}</Text><Text style={styles.postDate}>{new Date(post.created_at).toLocaleDateString()}</Text></View><Icon name="moreHorizontal" size={19} color={colors.faint}/></View>{post.caption?<Text style={styles.postCaption}>{post.caption}</Text>:null}{post.media?.length?<PostMedia items={post.media.map(media=>({type:media.type,uri:media.uri,alt:media.alt,width:media.width,height:media.height,durationMs:media.durationMs}))}/>:null}<Link href={{pathname:'/comments',params:{postId:post.id}}} asChild><Pressable accessibilityRole="link" style={styles.comments}><Icon name="comment" size={17} color={colors.muted}/><Text style={styles.commentsText}>{post.comment_count??0} comments</Text><Icon name="chevronRight" size={16} color={colors.faint}/></Pressable></Link></View>):<View style={styles.emptyPosts}><View style={styles.emptyGlyph}><Icon name="image" size={22} color={colors.brand}/></View><Text style={styles.emptyTitle}>No posts to show</Text><Text style={styles.muted}>This profile has not shared any public posts here.</Text></View>}
 </ScrollView></AppShell>;
}
function Stat({label,value}:{label:string;value:number}){return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>}

const styles=StyleSheet.create({content:{padding:spacing.xl,gap:spacing.lg,maxWidth:820,width:'100%',alignSelf:'center'},center:{flex:1,minHeight:420,justifyContent:'center',alignItems:'center',padding:spacing.xl,gap:10},muted:{fontSize:type.bodySM,lineHeight:21,color:colors.muted,textAlign:'center',maxWidth:440},top:{flexDirection:'row',alignItems:'center',gap:10},spacer:{flex:1},icon:{width:48,height:48,borderRadius:radius.md,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'},kicker:{fontSize:type.labelSM,fontWeight:'800',letterSpacing:1.8,color:colors.brand},hero:{padding:spacing.xl,borderRadius:radius.hero,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line,...elevation.low},heroTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12},avatar:{width:92,height:92,borderRadius:30,backgroundColor:colors.brandSoft,borderWidth:1,borderColor:colors.line,alignItems:'center',justifyContent:'center'},avatarImage:{width:92,height:92,borderRadius:30,backgroundColor:colors.surfaceStrong},avatarText:{fontSize:34,fontWeight:'800',color:colors.brand},name:{fontSize:type.displayLG,lineHeight:36,fontWeight:'800',letterSpacing:-.8,color:colors.ink,marginTop:18},handle:{fontSize:type.bodySM,color:colors.muted,marginTop:3},bio:{fontSize:type.bodyMD,lineHeight:23,color:colors.inkSoft,marginTop:12,maxWidth:620},bioMuted:{fontSize:type.bodyMD,lineHeight:23,color:colors.faint,marginTop:12},verified:{alignSelf:'flex-start',marginTop:10,paddingHorizontal:9,minHeight:26,borderRadius:radius.pill,backgroundColor:colors.brand,flexDirection:'row',alignItems:'center',gap:4},verifiedText:{fontSize:type.labelSM,fontWeight:'800',color:colors.white},rule:{height:1,backgroundColor:colors.line,marginTop:20},stats:{flexDirection:'row',gap:34,paddingTop:18},stat:{minWidth:78},statValue:{fontSize:type.numeric,lineHeight:26,fontWeight:'800',color:colors.ink},statLabel:{fontSize:type.labelSM,color:colors.muted,marginTop:3},follow:{minHeight:46,paddingHorizontal:18,borderRadius:radius.md,backgroundColor:colors.brand,justifyContent:'center',alignItems:'center',minWidth:96},followSecondary:{backgroundColor:colors.brandSoft,borderWidth:1,borderColor:colors.line},followText:{color:colors.white,fontWeight:'800'},followTextSecondary:{color:colors.brand},disabled:{opacity:.58},primary:{minHeight:46,paddingHorizontal:16,borderRadius:radius.md,backgroundColor:colors.brand,justifyContent:'center',alignItems:'center',flexDirection:'row',gap:8,marginTop:4},primaryText:{color:colors.white,fontWeight:'800'},info:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.brandSoft,borderWidth:1,borderColor:colors.line,flexDirection:'row',alignItems:'flex-start',gap:12},infoGlyph:{width:38,height:38,borderRadius:12,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'},infoCopy:{flex:1},infoTitle:{fontSize:type.bodyMD,fontWeight:'800',color:colors.ink},infoBody:{fontSize:type.bodySM,lineHeight:20,color:colors.inkSoft,marginTop:4},inlineError:{padding:11,borderRadius:radius.md,backgroundColor:colors.dangerSoft,flexDirection:'row',alignItems:'center',gap:7},inlineErrorText:{flex:1,color:colors.danger,fontSize:type.bodySM},postsHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingTop:4},postsTitle:{fontSize:type.titleLG,fontWeight:'800',color:colors.ink},postsSubtitle:{fontSize:type.labelSM,color:colors.muted,marginTop:2},postCard:{padding:spacing.lg,borderRadius:radius.xl,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line,...elevation.low},postByline:{flexDirection:'row',alignItems:'center',gap:9},miniAvatar:{width:38,height:38,borderRadius:13,backgroundColor:colors.brandSoft,alignItems:'center',justifyContent:'center'},miniAvatarText:{color:colors.brand,fontWeight:'800'},postBylineCopy:{flex:1},postName:{fontWeight:'800',color:colors.ink},postDate:{fontSize:type.labelSM,color:colors.faint,marginTop:2},postCaption:{fontSize:type.bodyMD,lineHeight:22,color:colors.inkSoft,marginTop:12},comments:{minHeight:42,marginTop:10,paddingTop:8,borderTopWidth:1,borderTopColor:colors.line,flexDirection:'row',alignItems:'center',gap:6},commentsText:{flex:1,fontSize:type.labelSM,color:colors.muted,fontWeight:'700'},emptyPosts:{padding:spacing.xxl,borderRadius:radius.lg,borderWidth:1,borderColor:colors.line,alignItems:'center',gap:6},emptyGlyph:{width:50,height:50,borderRadius:17,backgroundColor:colors.brandSoft,alignItems:'center',justifyContent:'center'},emptyTitle:{fontSize:type.titleMD,fontWeight:'800',color:colors.ink},postError:{padding:spacing.md,borderRadius:radius.md,backgroundColor:colors.warningSoft},errorTitle:{fontSize:type.titleLG,fontWeight:'800',color:colors.ink,textAlign:'center'},stateGlyph:{width:56,height:56,borderRadius:18,backgroundColor:colors.brandSoft,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.line},});
