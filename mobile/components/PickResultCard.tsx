import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { RacketThumb } from '@/components/RacketThumb';
import { COLORS, SPACE } from '@/constants/theme';
import type { PickResult } from '@/types/api';

interface Props {
  pick: PickResult;
  rank: number;
}

export function PickResultCard({ pick, rank }: Props) {
  const r = pick.racket;
  const str = pick.string;
  const isTop = rank === 0;

  return (
    <View style={[styles.card, isTop && styles.cardGold]}>
      <View style={styles.rankRow}>
        <Text style={styles.rank}>{isTop ? '★ TOP COMBO' : `#${rank + 1}`}</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreNum}>{pick.matchScore}</Text>
          <Text style={styles.scoreDen}> /100</Text>
        </View>
      </View>

      <View style={styles.head}>
        <RacketThumb racket={r} photoUrl={pick.photoUrl} />
        <View style={styles.meta}>
          <Text style={styles.brand}>{r.Brand}</Text>
          <Text style={styles.model}>
            {r.Model}{' '}
            <Text style={styles.year}>({r.Year})</Text>
          </Text>
          <Text style={styles.price}>
            ${r.Price_USD}
            <Text style={styles.priceNote}> MSRP approx.</Text>
          </Text>
        </View>
      </View>

      <View style={styles.specGrid}>
        {[
          `${r.Weight_Strung_oz.toFixed(1)} oz`,
          `${r.Head_Size_sqin}"`,
          r.String_Pattern,
          String(r.Balance_pts),
          `SW ${r.Swingweight}`,
          `RA ${r.Stiffness_RA}`,
          r.Frame_Type
        ].map((t) => (
          <View key={t} style={styles.specPill}>
            <Text style={styles.specTxt}>{t}</Text>
          </View>
        ))}
      </View>

      <View style={styles.why}>
        <Text style={styles.whyLabel}>Why this racket</Text>
        <Text style={styles.whyBody}>{pick.why}</Text>
      </View>

      <View style={styles.tagRow}>
        {pick.tags.map((tag, i) => (
          <View
            key={`tag-${rank}-${i}`}
            style={[styles.tag, tag.startsWith('⚠') && styles.tagWarn]}
          >
            <Text style={[styles.tagTxt, tag.startsWith('⚠') && styles.tagTxtWarn]}>{tag}</Text>
          </View>
        ))}
      </View>

      {str && pick.buyStringUrl && pick.tension != null ? (
        <View style={styles.strBlock}>
          <Text style={styles.strLabel}>String + tension</Text>
          <Text style={styles.strTitle}>
            {str.Brand} {str.Model}{' '}
            <Text style={styles.strMuted}>({str.String_Type})</Text>
          </Text>
          <Text style={styles.strMeta}>
            {str.Gauge_Name} gauge ·{' '}
            <Text style={{ fontWeight: '700' }}>{pick.tension} lb</Text>
            {' · '}
            {str.Tension_Min_lbs}–{str.Tension_Max_lbs} suggested
          </Text>
          <LinkButton title="Buy this string" href={pick.buyStringUrl} subtle />
        </View>
      ) : null}

      <LinkButton title="Buy this racket" href={pick.buyRacketUrl} accent />
    </View>
  );
}

function LinkButton({
  title,
  href,
  accent,
  subtle
}: {
  title: string;
  href: string;
  accent?: boolean;
  subtle?: boolean;
}) {
  return (
    <Pressable
      style={[styles.linkBtn, accent && styles.linkBtnAccent, subtle && styles.linkBtnGhost]}
      onPress={() => {
        Linking.openURL(href).catch(() => {});
      }}
    >
      <Text style={[styles.linkBtnTxt, accent && styles.linkBtnTxtAccent, subtle && styles.linkBtnTxtGhost]}>
        {title}
      </Text>
      <Text style={[styles.ext, accent && styles.extAccent]}>↗</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: SPACE.radiusLg,
    padding: SPACE.md,
    marginBottom: SPACE.lg,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderSoft
  },
  cardGold: {
    borderColor: COLORS.goldRank,
    borderWidth: 2,
    shadowColor: COLORS.goldRank,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.sm
  },
  rank: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.courtDark,
    letterSpacing: 0.3
  },
  scoreBadge: { flexDirection: 'row', alignItems: 'baseline' },
  scoreNum: { fontSize: 28, fontWeight: '900', color: COLORS.courtDark },
  scoreDen: { fontSize: 14, fontWeight: '700', color: COLORS.muted },
  head: { flexDirection: 'row', gap: SPACE.md, marginBottom: SPACE.md },
  meta: { flex: 1, justifyContent: 'center' },
  brand: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: COLORS.courtDark,
    marginBottom: 2
  },
  model: { fontSize: 18, fontWeight: '900', color: COLORS.cardText },
  year: { fontWeight: '600', color: COLORS.muted },
  price: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.cardText
  },
  priceNote: { fontWeight: '500', fontSize: 12, color: COLORS.muted },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  specPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.ball + '30'
  },
  specTxt: { fontSize: 11.5, fontWeight: '700', color: COLORS.courtDark },
  why: { marginTop: SPACE.md },
  whyLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.06,
    color: COLORS.courtDark,
    marginBottom: 4
  },
  whyBody: { fontSize: 14.5, lineHeight: 21, color: COLORS.cardText },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACE.sm },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.ball + '25'
  },
  tagWarn: { backgroundColor: '#fff8e8' },
  tagTxt: { fontSize: 11.5, fontWeight: '600', color: COLORS.cardText },
  tagTxtWarn: { color: COLORS.warning },
  strBlock: {
    marginTop: SPACE.md,
    paddingTop: SPACE.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.borderSoft
  },
  strLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: COLORS.muted,
    marginBottom: 6
  },
  strTitle: { fontSize: 16, fontWeight: '800', color: COLORS.cardText },
  strMuted: { fontWeight: '600', color: COLORS.muted },
  strMeta: { fontSize: 13, marginTop: 4, color: COLORS.cardText },

  linkBtn: {
    marginTop: SPACE.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.court,
    paddingVertical: 12
  },
  linkBtnAccent: {
    marginTop: SPACE.md,
    backgroundColor: COLORS.courtDark,
    borderColor: COLORS.courtDark
  },
  linkBtnGhost: { borderWidth: StyleSheet.hairlineWidth },
  linkBtnTxt: { fontWeight: '800', color: COLORS.courtDark, fontSize: 15 },
  linkBtnTxtAccent: { color: '#fff' },
  linkBtnTxtGhost: { fontSize: 14 },
  ext: {
    fontSize: 16,
    color: COLORS.courtDark,
    fontWeight: '600',
    marginTop: -1
  },
  extAccent: { color: '#fff' }
});
