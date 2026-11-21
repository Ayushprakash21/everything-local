import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { request } from '../../src/api/client';
import { formatPaise } from '../../src/utils/format';
import { DollarSign, TrendingUp, ShieldCheck, CheckCircle2 } from 'lucide-react-native';

export default function MerchantFinanceScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFinance = async () => {
    try {
      const res = await request<any>('/merchant/finance/statements');
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFinance();
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  const summary = data?.summary;
  const ledgerEntries = data?.ledgerEntries || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings & Commission</Text>
        <Text style={styles.headerSub}>Transparent 3.5% commission • Weekly automated payout</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
      >
        {/* KPI Cards */}
        {summary && (
          <View style={styles.kpiContainer}>
            <View style={styles.mainKpiCard}>
              <View style={styles.kpiHeader}>
                <Text style={styles.kpiLabel}>NET PAYABLE TO YOU</Text>
                <ShieldCheck size={16} color="#a7f3d0" />
              </View>
              <Text style={styles.mainKpiVal}>{summary.totalNetPayableFormatted}</Text>
              <Text style={styles.kpiHint}>Eligible for direct NEFT/UPI weekly settlement</Text>
            </View>

            <View style={styles.subKpiRow}>
              <View style={styles.subKpiCard}>
                <Text style={styles.subKpiLabel}>Total Gross Sales</Text>
                <Text style={styles.subKpiVal}>{summary.totalGrossSalesFormatted}</Text>
                <Text style={styles.subKpiHint}>{summary.completedOrdersCount} orders fulfilled</Text>
              </View>

              <View style={styles.subKpiCard}>
                <Text style={styles.subKpiLabel}>Platform Comm. (3.5%)</Text>
                <Text style={[styles.subKpiVal, { color: '#d97706' }]}>
                  {summary.totalCommissionWithheldFormatted}
                </Text>
                <Text style={styles.subKpiHint}>Fair sustainable rate</Text>
              </View>
            </View>
          </View>
        )}

        {/* Ledger Rows */}
        <View style={styles.ledgerSection}>
          <Text style={styles.sectionTitle}>Immutable Financial Ledger</Text>
          <Text style={styles.sectionSub}>Recorded strictly in integer paise for auditability</Text>

          {ledgerEntries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Completed orders will generate immutable settlement ledger rows here.</Text>
            </View>
          ) : (
            <View style={styles.ledgerCard}>
              {ledgerEntries.map((row: any) => {
                const isCredit = row.amountPaise > 0;
                return (
                  <View key={row.id} style={styles.ledgerRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ledgerType}>{row.entryType}</Text>
                      <Text style={styles.ledgerRef} numberOfLines={1}>{row.reference || '—'}</Text>
                      <Text style={styles.ledgerDate}>
                        {new Date(row.createdAt).toLocaleDateString()}
                      </Text>
                    </View>

                    <Text style={[styles.ledgerAmount, isCredit ? styles.amountCredit : styles.amountDebit]}>
                      {isCredit ? '+' : ''}{formatPaise(row.amountPaise)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  kpiContainer: {
    gap: 12,
  },
  mainKpiCard: {
    backgroundColor: '#047857',
    borderRadius: 24,
    padding: 22,
    gap: 8,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#a7f3d0',
    letterSpacing: 0.5,
  },
  mainKpiVal: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  kpiHint: {
    fontSize: 11,
    color: '#d1fae5',
    fontWeight: '500',
  },
  subKpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  subKpiCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  subKpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  subKpiVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  subKpiHint: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  ledgerSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  ledgerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  ledgerType: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  ledgerRef: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  ledgerDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  ledgerAmount: {
    fontSize: 14,
    fontWeight: '900',
  },
  amountCredit: {
    color: '#059669',
  },
  amountDebit: {
    color: '#dc2626',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
