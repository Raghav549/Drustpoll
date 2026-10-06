import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppShell } from '../src/ui/AppShell';
import { addComment, getComments, getCommentReplies } from '../src/api/client';
import { Icon } from '../src/ui/icons';
import { colors, radius, spacing, type } from '../src/ui/theme';

type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  reply_count?: number;
};

const initial = (value?: string | null) => (value || 'D').slice(0, 1).toUpperCase();
function when(iso: string) {
  const delta = Date.now() - new Date(iso).getTime();
  const mins = Math.round(delta / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return new Date(iso).toLocaleDateString();
}

function Avatar({ uri, name, size = 36 }: { uri?: string | null; name?: string | null; size?: number }) {
  const style = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} accessibilityLabel={`${name ?? 'User'} avatar`} style={style} />;
  return (
    <View style={[style, styles.avatarFallback]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.42 }]}>{initial(name)}</Text>
    </View>
  );
}

export default function Comments() {
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  const id = Array.isArray(postId) ? postId[0] : postId;

  const [comments, setComments] = useState<Comment[]>([]);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, Comment[]>>({});
  const [openThreads, setOpenThreads] = useState<Set<string>>(new Set());
  const [repliesLoading, setRepliesLoading] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!id) {
        setError('A post reference is required to open comments.');
        setLoading(false);
        return;
      }
      if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const page = await getComments(id, 30);
        const rows: Comment[] = page.items ?? page.comments ?? [];
        setComments(rows);
        setNextBefore(page.nextBefore ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load comments');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = async () => {
    if (!id || !nextBefore || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getComments(id, 30, nextBefore);
      const rows: Comment[] = page.items ?? page.comments ?? [];
      setComments((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        return [...prev, ...rows.filter((x) => !seen.has(x.id))];
      });
      setNextBefore(page.nextBefore ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load older comments');
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleThread = async (comment: Comment) => {
    const next = new Set(openThreads);
    if (next.has(comment.id)) {
      next.delete(comment.id);
      setOpenThreads(next);
      return;
    }
    next.add(comment.id);
    setOpenThreads(next);
    if (replies[comment.id]) return;
    setRepliesLoading(comment.id);
    try {
      const page = await getCommentReplies(comment.id, 50);
      setReplies((prev) => ({ ...prev, [comment.id]: page.items ?? page.replies ?? page.comments ?? [] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load replies');
    } finally {
      setRepliesLoading(null);
    }
  };

  const submit = async () => {
    if (!id || !body.trim() || sending) return;
    setSending(true);
    setError(null);
    const parent = replyTo;
    try {
      await addComment(id, body.trim(), parent?.id);
      setBody('');
      setReplyTo(null);
      if (parent) {
        // Refresh just the affected thread so the reply appears in place.
        const page = await getCommentReplies(parent.id, 50);
        setReplies((prev) => ({ ...prev, [parent.id]: page.items ?? page.replies ?? page.comments ?? [] }));
        setOpenThreads((prev) => new Set(prev).add(parent.id));
        setComments((prev) => prev.map((c) => (c.id === parent.id ? { ...c, reply_count: (c.reply_count ?? 0) + 1 } : c)));
      } else {
        await load('refresh');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add comment. Your text is preserved.');
    } finally {
      setSending(false);
    }
  };

  const startReply = (comment: Comment) => {
    setReplyTo(comment);
    inputRef.current?.focus();
  };

  return (
    <AppShell>
      <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>CONVERSATION</Text>
            <Text style={styles.title}>Comments</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Refresh comments" onPress={() => void load('refresh')} style={styles.iconButton}>
            <Icon name="refresh" size={18} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load('refresh')} />}
        >
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator />
              <Text style={styles.muted}>Loading the conversation…</Text>
            </View>
          ) : error && !comments.length ? (
            <View accessibilityRole="alert" style={styles.errorBox}>
              <Text style={styles.errorTitle}>Comments unavailable</Text>
              <Text style={styles.errorBody}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={() => void load()} style={styles.retry}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.empty}>
              <Icon name="comment" size={26} color={colors.faint} />
              <Text style={styles.emptyTitle}>No comments yet</Text>
              <Text style={styles.emptyBody}>Be the first to add something useful to this post.</Text>
            </View>
          ) : (
            comments.map((comment) => {
              const open = openThreads.has(comment.id);
              const thread = replies[comment.id] ?? [];
              return (
                <View key={comment.id} style={styles.comment}>
                  <View style={styles.commentRow}>
                    <Avatar uri={comment.avatar_url} name={comment.display_name ?? comment.username} />
                    <View style={styles.commentBody}>
                      <View style={styles.commentHead}>
                        <Text style={styles.name}>{comment.display_name || comment.username || 'Member'}</Text>
                        <Text style={styles.meta}>{when(comment.created_at)}</Text>
                      </View>
                      <Text style={styles.text}>{comment.body}</Text>
                      <View style={styles.actions}>
                        <Pressable accessibilityRole="button" accessibilityLabel={`Reply to ${comment.display_name || comment.username || 'member'}`} onPress={() => startReply(comment)} style={styles.action}>
                          <Icon name="comment" size={15} color={colors.muted} />
                          <Text style={styles.actionText}>Reply</Text>
                        </Pressable>
                        {(comment.reply_count ?? 0) > 0 ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ expanded: open }}
                            onPress={() => void toggleThread(comment)}
                            style={styles.action}
                          >
                            <Icon name={open ? 'chevronUp' : 'chevronDown'} size={15} color={colors.brand} />
                            <Text style={[styles.actionText, styles.actionBrand]}>
                              {open ? 'Hide' : 'Show'} {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  {open ? (
                    <View style={styles.thread}>
                      {repliesLoading === comment.id ? (
                        <View style={styles.threadLoading}>
                          <ActivityIndicator size="small" />
                          <Text style={styles.muted}>Loading replies…</Text>
                        </View>
                      ) : thread.length ? (
                        thread.map((reply) => (
                          <View key={reply.id} style={styles.replyRow}>
                            <Avatar uri={reply.avatar_url} name={reply.display_name ?? reply.username} size={28} />
                            <View style={styles.commentBody}>
                              <View style={styles.commentHead}>
                                <Text style={styles.replyName}>{reply.display_name || reply.username || 'Member'}</Text>
                                <Text style={styles.meta}>{when(reply.created_at)}</Text>
                              </View>
                              <Text style={styles.text}>{reply.body}</Text>
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.muted}>No replies in this thread yet.</Text>
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })
          )}

          {nextBefore ? (
            <Pressable accessibilityRole="button" disabled={loadingMore} onPress={() => void loadMore()} style={styles.more}>
              {loadingMore ? <ActivityIndicator size="small" /> : <Text style={styles.moreText}>Load older comments</Text>}
            </Pressable>
          ) : null}

          {error && comments.length ? (
            <View accessibilityRole="alert" style={styles.inlineError}>
              <Text style={styles.errorBody}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.composer}>
          {replyTo ? (
            <View style={styles.replyBanner}>
              <Icon name="comment" size={14} color={colors.brand} />
              <Text style={styles.replyBannerText} numberOfLines={1}>
                Replying to {replyTo.display_name || replyTo.username || 'member'}
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Cancel reply" onPress={() => setReplyTo(null)} hitSlop={8}>
                <Icon name="close" size={15} color={colors.muted} />
              </Pressable>
            </View>
          ) : null}
          <TextInput
            ref={inputRef}
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={2000}
            placeholder={replyTo ? 'Write a reply…' : 'Add a thoughtful comment…'}
            placeholderTextColor={colors.faint}
            accessibilityLabel={replyTo ? 'Reply text' : 'Comment text'}
            style={styles.input}
          />
          <View style={styles.bottom}>
            <Text style={styles.counter}>{body.length}/2000</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: sending || !body.trim(), busy: sending }}
              disabled={sending || !body.trim()}
              onPress={() => void submit()}
              style={[styles.send, (sending || !body.trim()) && styles.disabled]}
            >
              {sending ? <ActivityIndicator color={colors.white} /> : <Icon name="send" size={17} color={colors.white} />}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.xl, gap: spacing.md, maxWidth: 760, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontSize: type.labelSM, fontWeight: '800', letterSpacing: 1.8, color: colors.social },
  title: { fontSize: type.displayLG, fontWeight: '800', lineHeight: 38, color: colors.ink },
  iconButton: { width: 44, height: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  list: { flex: 1 },
  listContent: { gap: spacing.sm, paddingBottom: spacing.lg },
  center: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 8 },
  muted: { fontSize: type.bodySM, color: colors.muted },
  comment: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  commentRow: { flexDirection: 'row', gap: 10 },
  commentBody: { flex: 1, gap: 3 },
  commentHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: type.bodyMD, fontWeight: '800', color: colors.ink },
  replyName: { fontSize: type.bodySM, fontWeight: '800', color: colors.ink },
  meta: { fontSize: type.labelSM, color: colors.muted },
  text: { fontSize: type.bodyMD, lineHeight: 22, color: colors.inkSoft },
  actions: { flexDirection: 'row', gap: 16, marginTop: 4 },
  action: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: type.labelMD, fontWeight: '700', color: colors.muted },
  actionBrand: { color: colors.brand },
  thread: { marginTop: 8, marginLeft: 46, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: colors.line, gap: 10 },
  threadLoading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replyRow: { flexDirection: 'row', gap: 9 },
  avatarFallback: { backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '800' },
  empty: { padding: spacing.xxl, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, backgroundColor: colors.surface, gap: 7 },
  emptyTitle: { fontSize: type.titleMD, fontWeight: '800', color: colors.ink },
  emptyBody: { fontSize: type.bodySM, lineHeight: 21, textAlign: 'center', color: colors.muted, maxWidth: 420 },
  errorBox: { padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger, gap: 6 },
  errorTitle: { fontWeight: '800', color: colors.danger },
  errorBody: { fontSize: type.bodySM, lineHeight: 21, color: colors.inkSoft },
  inlineError: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.dangerSoft },
  retry: { minHeight: 44, alignSelf: 'flex-start', paddingHorizontal: 16, borderRadius: radius.md, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: colors.white, fontWeight: '800' },
  more: { minHeight: 46, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  moreText: { fontWeight: '800', color: colors.ink },
  composer: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing.md, gap: 6 },
  replyBanner: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 6, paddingHorizontal: 9, borderRadius: radius.md, backgroundColor: colors.brandSoft },
  replyBannerText: { flex: 1, fontSize: type.labelMD, fontWeight: '700', color: colors.brand },
  input: { minHeight: 90, color: colors.ink, fontSize: type.bodyMD, lineHeight: 22, textAlignVertical: 'top' },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { fontSize: type.labelSM, color: colors.faint },
  send: { minWidth: 52, minHeight: 44, paddingHorizontal: 18, borderRadius: radius.md, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 },
});
