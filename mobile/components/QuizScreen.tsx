import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PickResultCard } from '@/components/PickResultCard';
import { LabeledPicker } from '@/components/LabeledPicker';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionCard } from '@/components/SectionCard';
import { TextField } from '@/components/TextField';
import {
  ARM_ITEMS,
  BUDGET_ITEMS,
  GRIP_ITEMS,
  LEVEL_ITEMS,
  STRING_PREF_ITEMS,
  STYLE_ITEMS,
  SWING_ITEMS,
  VOLLEY_ITEMS
} from '@/constants/formOptions';
import { COLORS, SPACE } from '@/constants/theme';
import { fetchRecommendation } from '@/lib/api';
import { bumpPlayerCount, loadPlayerCount } from '@/lib/counter';
import { getApiBase } from '@/lib/getApiBase';
import { buildRecommendationMailto, summarizeProfile } from '@/lib/mailto';
import type {
  RecommendationPayload,
  RecommendationSuccess
} from '@/types/api';

const EMAIL_RGX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface QuizForm {
  height: string;
  weight: string;
  grip: string;
  level: string;
  swing: string;
  style: string;
  volley: string;
  arm: string;
  budget: string;
  stringpref: string;
  notes: string;
  email: string;
}

const DEFAULT_FORM: QuizForm = {
  height: '70',
  weight: '160',
  grip: '2',
  level: 'Intermediate',
  swing: 'Medium',
  style: 'All-Court',
  volley: '2',
  arm: 'any',
  budget: '250',
  stringpref: 'auto',
  notes: '',
  email: ''
};

function buildPayload(form: QuizForm): RecommendationPayload | null {
  const heightIn = parseFloat(form.height);
  const weightLb = parseFloat(form.weight);
  if (Number.isNaN(heightIn) || Number.isNaN(weightLb)) {
    Alert.alert(
      'Almost there',
      'Enter numeric height (inches) and weight (lb).'
    );
    return null;
  }

  return {
    heightIn,
    weightLb,
    gripIdx: form.grip,
    level: form.level,
    swing: form.swing,
    style: form.style,
    volley: form.volley,
    arm: form.arm === 'Yes' ? 'Yes' : 'any',
    utr: form.utr.trim(),
    usta: form.usta.trim(),
    budget: form.budget,
    stringPref: form.stringpref,
    notesText: form.notes
  };
}

function profileSnippet(form: QuizForm): string {
  return summarizeProfile({
    level: form.level,
    swing: form.swing,
    style: form.style,
    volley: form.volley,
    arm: form.arm,
    budget: form.budget,
    stringpref: form.stringpref,
    notes: form.notes
  });
}

export function QuizScreen() {
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<QuizForm>(DEFAULT_FORM);

  function patch<K extends keyof QuizForm>(key: K, value: QuizForm[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  const [players, setPlayers] = useState<number | null>(null);
  const [result, setResult] = useState<RecommendationSuccess | null>(null);
  const [loading, setLoading] = useState(false);

  const apiReady = !!getApiBase();

  useEffect(() => {
    let alive = true;
    void loadPlayerCount().then((n) => {
      if (!alive || n === null) return;
      setPlayers(n);
    });
    return () => {
      alive = false;
    };
  }, []);

  const runRecommend = useCallback(
    async (options: { bump: boolean }) => {
      const payload = buildPayload(form);
      if (!payload) return null;

      setLoading(true);
      try {
        const res = await fetchRecommendation(payload);

        if (!res.ok) {
          Alert.alert("Can't load picks", res.error);
          return null;
        }

        setResult(res);
        if (options.bump) {
          void bumpPlayerCount().then((n) => {
            if (typeof n === 'number') setPlayers(n);
          });
        }
        return res;
      } catch {
        Alert.alert(
          'Network error',
          'Check Wi‑Fi and EXPO_PUBLIC_API_URL points at your Next dev server.'
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  async function onShareDraft() {
    const txt = `${profileSnippet(form)}\n\n(Tap Get recommendations after opening the app)`;
    try {
      await Share.share({ title: 'Racket IQ profile', message: txt });
    } catch {
      /* cancelled */
    }
  }

  async function onShareResults(current: RecommendationSuccess) {
    const lines = [
      `${current.persona.label}`,
      `${current.persona.blurb}`,
      '',
      'Top pickup:',
      `${current.picks[0]?.racket.Brand} ${current.picks[0]?.racket.Model} · match ${current.picks[0]?.matchScore}/100`
    ];
    try {
      await Share.share({ title: 'My Racket IQ results', message: lines.join('\n') });
    } catch {
      /* */
    }
  }

  async function onEmailTap() {
    const addr = form.email.trim();
    if (!EMAIL_RGX.test(addr)) {
      Alert.alert(
        'Add your email',
        'Fill the Results by email field near the bottom first, then tap Find & email again.'
      );
      return;
    }

    const res = await runRecommend({ bump: true });
    if (!res) return;
    openMail(addr, res, form);
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
    >
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: SPACE.xl + insets.bottom, paddingTop: 8 }
        ]}
      >
        {!apiReady ? (
          <View style={styles.apiWarn}>
            <Text style={styles.apiWarnTitle}>Connect to your API</Text>
            <Text style={styles.apiWarnBody}>
              Start the Next.js app ({'`'}npm run dev{'`'} in the repo root), then run Expo with your
              computer’s LAN URL, e.g.{' '}
              <Text style={styles.mono}>
                EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
              </Text>
              . Phone + laptop must share Wi‑Fi; restart Expo after changing env.
            </Text>
          </View>
        ) : null}

        {/* Hero */}
        <View style={[styles.hero, { paddingTop: SPACE.md }]}>
          <Text style={styles.heroBall}>🎾</Text>
          <Text style={styles.heroTitle}>Find your racket + string combo</Text>
          <Text style={styles.heroSub}>
            Mobile-native flow — tuned for quick taps and one-handed scrolling.
          </Text>
          {players !== null ? (
            <View style={styles.counter}>
              <View style={styles.pulseDot} />
              <Text style={styles.counterTxt}>
                <Text style={styles.counterStrong}>{players.toLocaleString()}</Text>
                {'  '}
                {players === 1 ? 'player' : 'players'} matched here
              </Text>
            </View>
          ) : (
            <View style={[styles.counter, { opacity: 0 }]}>
              <Text style={styles.counterTxt}> </Text>
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: SPACE.lg }}>
          <SectionCard title="About you">
            <View style={styles.rowGap}>
              <TextField
                style={{ flex: 1 }}
                label="Height"
                hint="in"
                keyboardType="number-pad"
                value={form.height}
                onChangeText={(t) => patch('height', t)}
              />
              <TextField
                style={{ flex: 1 }}
                label="Weight"
                hint="lb"
                keyboardType="number-pad"
                value={form.weight}
                onChangeText={(t) => patch('weight', t)}
              />
            </View>
            <LabeledPicker
              label="Grip size"
              items={[...GRIP_ITEMS]}
              selected={form.grip}
              onChange={(v) => patch('grip', v)}
            />
          </SectionCard>

          <SectionCard title="Your game">
            <LabeledPicker
              label="Skill level"
              items={[...LEVEL_ITEMS]}
              selected={form.level}
              onChange={(v) => patch('level', v)}
            />
            <LabeledPicker
              label="Swing speed"
              items={[...SWING_ITEMS]}
              selected={form.swing}
              onChange={(v) => patch('swing', v)}
            />
            <LabeledPicker
              label="Play style"
              items={[...STYLE_ITEMS]}
              selected={form.style}
              onChange={(v) => patch('style', v)}
            />
            <LabeledPicker
              label="Volleys"
              items={[...VOLLEY_ITEMS]}
              selected={form.volley}
              onChange={(v) => patch('volley', v)}
            />
            <LabeledPicker
              label="Arm-friendly only?"
              items={[...ARM_ITEMS]}
              selected={form.arm}
              onChange={(v) => patch('arm', v)}
            />
          </SectionCard>

          <SectionCard title="Ratings (optional)">
            <View style={styles.rowGap}>
              <TextField
                style={{ flex: 1 }}
                label="UTR"
                hint="e.g. 5.5"
                keyboardType="decimal-pad"
                value={form.utr}
                onChangeText={(t) => patch('utr', t)}
              />
              <TextField
                style={{ flex: 1 }}
                label="USTA"
                hint="e.g. 3.5"
                keyboardType="decimal-pad"
                value={form.usta}
                onChangeText={(t) => patch('usta', t)}
              />
            </View>
          </SectionCard>

          <SectionCard title="Budget & strings">
            <LabeledPicker
              label="Max racket budget"
              items={[...BUDGET_ITEMS]}
              selected={form.budget}
              onChange={(v) => patch('budget', v)}
            />
            <LabeledPicker
              label="String preference"
              items={[...STRING_PREF_ITEMS]}
              selected={form.stringpref}
              onChange={(v) => patch('stringpref', v)}
            />
          </SectionCard>

          <SectionCard title="Notes (optional)">
            <TextField
              label="Anything else?"
              hint="spin, elbow, lighter frame…"
              value={form.notes}
              multiline
              onChangeText={(t) => patch('notes', t)}
              placeholder="Tell the matcher what matters"
            />
          </SectionCard>

          <SectionCard title="Results by email">
            <Text style={styles.micro}>
              Opens the Mail app with links — your address stays local to this phone.
            </Text>
            <TextField
              label="Email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={form.email}
              onChangeText={(t) => patch('email', t)}
              placeholder="you@club.com"
            />
          </SectionCard>

          <PrimaryButton
            label={loading ? 'Matching…' : 'Get my racket + string'}
            loading={loading}
            onPress={() => void runRecommend({ bump: true })}
            disabled={loading}
            style={{ marginBottom: SPACE.sm }}
          />

          <View style={styles.rowButtons}>
            <PrimaryButton
              variant="outline"
              label={loading ? '…' : 'Find & email'}
              loading={loading}
              onPress={() => void onEmailTap()}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <PrimaryButton
              variant="outline"
              label="Share draft"
              onPress={() => void onShareDraft()}
              style={{ flex: 1 }}
            />
          </View>

          {/* Results */}
          {result ? (
            <View style={styles.resultsBlock}>
              <Text style={styles.resultsHeading}>Your match</Text>

              <View style={styles.personaPanel}>
                <Text style={styles.personaEyebrow}>YOUR PLAYER TYPE</Text>
                <Text style={styles.personaLabel}>{result.persona.label}</Text>
                <Text style={styles.personaBlurb}>{result.persona.blurb}</Text>
              </View>

              {result.relaxations.length > 0 ? (
                <View style={styles.relaxBanner}>
                  <Text style={styles.relaxTxt}>
                    <Text style={{ fontWeight: '800' }}>Heads up — </Text>
                    {result.relaxations.join(' · ')}.
                  </Text>
                </View>
              ) : null}

              <View style={styles.summarySheet}>
                <Text style={styles.summaryTitle}>Profile recap</Text>
                <Text style={styles.summaryBody}>
                  <Text style={{ fontWeight: '800' }}>{result.summary.level}</Text>
                  {result.summary.utr != null ? ` · UTR ${result.summary.utr}` : ''}
                  {result.summary.usta != null ? ` · USTA ${result.summary.usta}` : ''}
                  {`\n${result.summary.swing} swing · ${result.summary.style}`}
                  {`\n${result.summary.volleyLabel} volleys · grip L${result.summary.gripIdx}`}
                  {`\ntarget weight `}
                  <Text style={{ fontWeight: '800' }}>
                    {result.summary.targetWeight.toFixed(1)} oz
                  </Text>
                  {result.summary.budget >= 999
                    ? '\nbudget · no MSRP ceiling'
                    : `\nbudget · ≤ $${result.summary.budget}`}
                  {result.summary.parsedTags.length > 0
                    ? `\n📝 ${result.summary.parsedTags.join(' · ')}`
                    : ''}
                </Text>
              </View>

              {result.picks.map((pick, idx) => (
                <PickResultCard key={`${pick.racket.Racket_ID}-${idx}`} pick={pick} rank={idx} />
              ))}

              <SectionCard title="Iconic combos">
                {result.iconicCombos.map((c) => (
                  <View key={`${c.who}-${c.pair.slice(0, 28)}`} style={styles.comboRow}>
                    <Text style={styles.comboWho}>{c.who}</Text>
                    <Text style={styles.comboPair}>{c.pair}</Text>
                    <Text style={styles.comboWhy}>{c.why}</Text>
                  </View>
                ))}
              </SectionCard>

              <PrimaryButton
                variant="outline"
                label="Share top picks"
                onPress={() => void onShareResults(result)}
                style={{ marginBottom: SPACE.sm }}
              />
              <PrimaryButton
                variant="court"
                label="Email results again"
                onPress={() => {
                  const addr = form.email.trim();
                  if (!EMAIL_RGX.test(addr)) {
                    Alert.alert(
                      'Email required',
                      'Scroll up to Results by email and fill in your address first.'
                    );
                    return;
                  }
                  openMail(addr, result, form);
                }}
              />

              <Text style={styles.legal}>
                MSRP approximate · photos via Tennis Warehouse.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function openMail(recipient: string, res: RecommendationSuccess, form: QuizForm) {
  const addr = recipient.trim();
  if (!EMAIL_RGX.test(addr)) return;

  const href = buildRecommendationMailto(addr, res, profileSnippet(form));
  Linking.openURL(href).catch(() => {
    Alert.alert('Mail unavailable', 'No mail handler on this device.');
  });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgDeep },
  scrollContent: {},
  mono: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace'
    }),
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.courtDark
  },
  apiWarn: {
    marginHorizontal: SPACE.lg,
    marginBottom: SPACE.md,
    padding: SPACE.md,
    borderRadius: SPACE.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7'
  },
  apiWarnTitle: {
    fontWeight: '900',
    color: COLORS.warning,
    marginBottom: SPACE.xs,
    fontSize: 15
  },
  apiWarnBody: { fontSize: 13, lineHeight: 19.5, color: COLORS.warning },
  hero: {
    paddingHorizontal: SPACE.lg,
    paddingBottom: SPACE.lg,
    backgroundColor: COLORS.courtDark,
    borderBottomRightRadius: 22,
    borderBottomLeftRadius: 22,
    marginBottom: SPACE.md
  },
  heroBall: { fontSize: 44, textAlign: 'center', marginBottom: SPACE.sm },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.35,
    textAlign: 'center',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.32)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 2 }
  },
  heroSub: {
    marginTop: SPACE.sm,
    color: COLORS.courtLine,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.95
  },
  counter: {
    marginTop: SPACE.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth + 1,
    borderColor: COLORS.ball
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.ball,
    opacity: 0.9
  },
  counterTxt: { fontSize: 14.5, color: COLORS.courtDark, fontWeight: '600' },
  counterStrong: { fontWeight: '900', fontVariant: ['tabular-nums'] },

  rowGap: {
    flexDirection: 'row',
    gap: SPACE.sm,
    marginBottom: SPACE.sm
  },

  micro: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: SPACE.sm,
    lineHeight: 18.5
  },
  rowButtons: { flexDirection: 'row', gap: SPACE.sm, marginBottom: SPACE.lg },

  resultsBlock: {
    paddingTop: SPACE.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.ball + '40',
    marginTop: SPACE.sm
  },
  resultsHeading: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.2,
    color: '#fff',
    marginBottom: SPACE.md,
    paddingHorizontal: 2
  },
  personaPanel: {
    padding: SPACE.md,
    borderRadius: SPACE.radiusLg,
    marginBottom: SPACE.md,
    backgroundColor: COLORS.courtDark,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.ball
  },
  personaEyebrow: {
    color: COLORS.ball,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.12,
    marginBottom: 6
  },
  personaLabel: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.35,
    color: '#fff',
    marginBottom: SPACE.sm,
    flexWrap: 'wrap'
  },
  personaBlurb: { fontSize: 14.5, lineHeight: 21, color: COLORS.courtLine },
  relaxBanner: {
    borderRadius: SPACE.radius,
    padding: SPACE.md,
    backgroundColor: '#fff8e8',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#fcd34d',
    marginBottom: SPACE.md
  },
  relaxTxt: { fontSize: 13.5, lineHeight: 20, color: COLORS.warning },
  summarySheet: {
    backgroundColor: '#fff',
    borderRadius: SPACE.radius,
    padding: SPACE.md,
    marginBottom: SPACE.md,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.06,
    textTransform: 'uppercase',
    color: COLORS.courtDark,
    marginBottom: SPACE.sm
  },
  summaryBody: {
    fontSize: 14.5,
    lineHeight: 22,
    color: COLORS.cardText
  },
  comboRow: {
    marginBottom: SPACE.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderSoft,
    paddingBottom: SPACE.sm
  },
  comboWho: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.courtDark,
    marginBottom: 4
  },
  comboPair: { fontWeight: '700', color: COLORS.cardText, marginBottom: 6 },
  comboWhy: { fontSize: 13.5, lineHeight: 20, color: COLORS.cardText },

  legal: {
    marginTop: SPACE.lg,
    fontSize: 11.5,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.85,
    paddingHorizontal: SPACE.lg,
    paddingBottom: SPACE.xl
  }
});
