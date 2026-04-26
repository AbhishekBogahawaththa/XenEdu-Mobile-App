import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from '../../api/axios';
import { COLORS } from '../../utils/constants';

const AdminReports = () => {
  const [reportType, setReportType] = useState('income');

  // Income
  const [incomePeriod, setIncomePeriod] = useState('monthly');
  const [incomeMonth, setIncomeMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  });
  const [incomeYear, setIncomeYear] = useState(() => new Date().getFullYear().toString());
  const [incomeSearch, setIncomeSearch] = useState('');

  // Teacher
  const [teacherPeriod, setTeacherPeriod] = useState('monthly');
  const [teacherId, setTeacherId] = useState('');
  const [teacherMonth, setTeacherMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  });
  const [teacherYear, setTeacherYear] = useState(() => new Date().getFullYear().toString());
  const [teacherReportData, setTeacherReportData] = useState(null);
  const [loadingTeacher, setLoadingTeacher] = useState(false);

  // Date range
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateReportData, setDateReportData] = useState(null);
  const [loadingDate, setLoadingDate] = useState(false);

  // Student search
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return { value, label };
  });

  // Queries
  const { data: teachers } = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: () => api.get('/teachers').then(r => r.data),
  });

  const { data: students } = useQuery({
    queryKey: ['admin-students'],
    queryFn: () => api.get('/students').then(r => r.data),
  });

  const { data: monthlyReport, isLoading: loadingMonthly } = useQuery({
    queryKey: ['admin-monthly-report', incomeMonth],
    queryFn: () => api.get(`/fees/reports/monthly?month=${incomeMonth}`).then(r => r.data),
    enabled: reportType === 'income' && incomePeriod === 'monthly',
  });

  const { data: yearlyReport, isLoading: loadingYearly } = useQuery({
    queryKey: ['admin-yearly-report', incomeYear],
    queryFn: () => api.get(`/fees/reports/monthly?year=${incomeYear}`).then(r => r.data),
    enabled: reportType === 'income' && incomePeriod === 'yearly',
  });

  const { data: studentPayments, isLoading: loadingStudentPay } = useQuery({
    queryKey: ['admin-student-payments', selectedStudentId],
    queryFn: () => api.get(`/fees/student/${selectedStudentId}`).then(r => r.data),
    enabled: !!selectedStudentId && reportType === 'student',
  });

  const activeReport = incomePeriod === 'monthly' ? monthlyReport : yearlyReport;
  const loadingIncome = incomePeriod === 'monthly' ? loadingMonthly : loadingYearly;

  const filterBySearch = (records, search) => {
    if (!search) return records;
    return records?.filter(fee =>
      fee.studentId?.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      fee.studentId?.admissionNumber?.toLowerCase().includes(search.toLowerCase())
    );
  };

  const fetchTeacherReport = async () => {
    if (!teacherId) return;
    setLoadingTeacher(true);
    try {
      const param = teacherPeriod === 'monthly' ? `month=${teacherMonth}` : `year=${teacherYear}`;
      const res = await api.get(`/fees/reports/teacher/${teacherId}?${param}`);
      setTeacherReportData(res.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to generate teacher report');
    } finally {
      setLoadingTeacher(false);
    }
  };

  const fetchDateReport = async () => {
    if (!dateFrom || !dateTo) return;
    setLoadingDate(true);
    try {
      const res = await api.get(`/fees/reports/daterange?from=${dateFrom}&to=${dateTo}`);
      setDateReportData(res.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to generate date range report');
    } finally {
      setLoadingDate(false);
    }
  };

  // ── PDF Download ──────────────────────────────────────────────
  const downloadReport = async (title, htmlContent) => {
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Download ${title}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const generateIncomeHTML = (report, period) => `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
    h1 { color: #0d6b7a; font-size: 24px; margin-bottom: 4px; }
    h2 { color: #555; font-size: 14px; font-weight: normal; }
    .meta { color: #888; font-size: 12px; margin-bottom: 20px; }
    .summary { display: flex; gap: 10px; margin: 16px 0; }
    .card { background: #f0fbf7; padding: 12px; border-radius: 8px; flex: 1; border-left: 3px solid #0d6b7a; }
    .card-value { font-size: 16px; font-weight: bold; color: #0d6b7a; }
    .card-label { font-size: 10px; color: #888; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #0d6b7a; color: white; padding: 8px 10px; text-align: left; font-size: 11px; }
    td { padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 11px; }
    tr:nth-child(even) { background: #f9f9f9; }
    .paid { color: #10B981; font-weight: bold; }
    .unpaid { color: #EF4444; font-weight: bold; }
    .overdue { color: #F59E0B; font-weight: bold; }
    .footer { margin-top: 40px; text-align: center; color: #aaa; font-size: 10px; border-top: 1px solid #eee; padding-top: 16px; }
  </style>
</head>
<body>
  <h1>XenEdu — Income Report</h1>
  <h2>Period: ${period}</h2>
  <p class="meta">Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString()}</p>

  <div class="summary">
    <div class="card">
      <div class="card-value">Rs. ${report.summary?.totalGenerated?.toLocaleString()}</div>
      <div class="card-label">Total Generated</div>
    </div>
    <div class="card">
      <div class="card-value" style="color:#10B981">Rs. ${report.summary?.totalCollected?.toLocaleString()}</div>
      <div class="card-label">Collected</div>
    </div>
    <div class="card">
      <div class="card-value" style="color:#EF4444">Rs. ${report.summary?.totalUnpaid?.toLocaleString()}</div>
      <div class="card-label">Unpaid</div>
    </div>
    <div class="card">
      <div class="card-value">${report.summary?.collectionRate}</div>
      <div class="card-label">Collection Rate</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Student</th>
        <th>Admission No</th>
        <th>Class</th>
        <th>Amount</th>
        <th>Due Date</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${report.records?.map(fee => `
        <tr>
          <td>${fee.studentId?.userId?.name || 'N/A'}</td>
          <td>${fee.studentId?.admissionNumber || 'N/A'}</td>
          <td>${fee.classId?.name || 'N/A'}</td>
          <td>Rs. ${fee.amount?.toLocaleString()}</td>
          <td>${fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-GB') : 'N/A'}</td>
          <td class="${fee.status}">${fee.status}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">XenEdu Mirigama — Confidential Report — Do not distribute</div>
</body>
</html>`;

  const generateTeacherHTML = (report, period) => `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
    h1 { color: #0d6b7a; font-size: 24px; margin-bottom: 4px; }
    .meta { color: #888; font-size: 12px; margin-bottom: 16px; }
    .teacher-box { background: #0d6b7a; color: white; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .summary { display: flex; gap: 10px; margin: 16px 0; }
    .card { background: #f0fbf7; padding: 12px; border-radius: 8px; flex: 1; text-align: center; }
    .card-value { font-size: 16px; font-weight: bold; color: #0d6b7a; }
    .card-label { font-size: 10px; color: #888; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #0d6b7a; color: white; padding: 8px; text-align: left; font-size: 11px; }
    td { padding: 7px 8px; border-bottom: 1px solid #eee; font-size: 11px; }
    .total-row { background: #f0fbf7; font-weight: bold; }
    .footer { margin-top: 40px; text-align: center; color: #aaa; font-size: 10px; border-top: 1px solid #eee; padding-top: 16px; }
  </style>
</head>
<body>
  <h1>XenEdu — Teacher Report</h1>
  <p class="meta">Period: ${period} | Generated on ${new Date().toLocaleDateString('en-GB')}</p>

  <div class="teacher-box">
    <div style="font-size:18px;font-weight:bold">${report.teacher?.name}</div>
    <div style="opacity:0.8;margin-top:4px">${report.teacher?.email}</div>
    <div style="opacity:0.7;margin-top:2px;font-size:12px">${report.teacher?.subjects?.join(' • ')}</div>
  </div>

  <div class="summary">
    <div class="card">
      <div class="card-value">${report.totalClasses}</div>
      <div class="card-label">Classes</div>
    </div>
    <div class="card">
      <div class="card-value">Rs. ${report.totalGenerated?.toLocaleString()}</div>
      <div class="card-label">Generated</div>
    </div>
    <div class="card">
      <div class="card-value" style="color:#10B981">Rs. ${report.totalCollected?.toLocaleString()}</div>
      <div class="card-label">Collected</div>
    </div>
    <div class="card">
      <div class="card-value">${report.collectionRate}%</div>
      <div class="card-label">Rate</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Class</th>
        <th>Subject</th>
        <th>Students</th>
        <th>Fee/Month</th>
        <th>Generated</th>
        <th>Collected</th>
        <th>Rate</th>
      </tr>
    </thead>
    <tbody>
      ${report.classReports?.map(cls => `
        <tr>
          <td>${cls.className}</td>
          <td>${cls.subject}</td>
          <td>${cls.enrolledCount}</td>
          <td>Rs. ${cls.monthlyFee?.toLocaleString()}</td>
          <td>Rs. ${cls.totalGenerated?.toLocaleString()}</td>
          <td>Rs. ${cls.totalCollected?.toLocaleString()}</td>
          <td>${cls.collectionRate}%</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td>TOTAL</td>
        <td></td>
        <td></td>
        <td></td>
        <td>Rs. ${report.totalGenerated?.toLocaleString()}</td>
        <td>Rs. ${report.totalCollected?.toLocaleString()}</td>
        <td>${report.collectionRate}%</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">XenEdu Mirigama — Confidential Report — Do not distribute</div>
</body>
</html>`;

  const statusColors = {
    paid: { bg: '#F0FBF7', text: '#10B981' },
    unpaid: { bg: '#FEF2F2', text: '#EF4444' },
    overdue: { bg: '#FFFBEB', text: '#F59E0B' },
  };

  const filteredStudents = students?.students?.filter(s =>
    s.userId?.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.admissionNumber?.toLowerCase().includes(studentSearch.toLowerCase())
  ).slice(0, 6) || [];

  const selectedStudent = students?.students?.find(s => s._id === selectedStudentId);

  const SummaryCards = ({ data }) => (
    <View style={styles.summaryGrid}>
      {[
        { label: 'Generated', value: `Rs. ${(data?.summary?.totalGenerated || data?.totalGenerated || 0).toLocaleString()}`, color: COLORS.dark, icon: 'cash-outline' },
        { label: 'Collected', value: `Rs. ${(data?.summary?.totalCollected || data?.totalCollected || 0).toLocaleString()}`, color: '#10B981', icon: 'checkmark-circle-outline' },
        { label: 'Unpaid', value: `Rs. ${(data?.summary?.totalUnpaid || ((data?.totalGenerated || 0) - (data?.totalCollected || 0))).toLocaleString()}`, color: '#EF4444', icon: 'alert-circle-outline' },
        { label: 'Rate', value: data?.summary?.collectionRate || `${data?.collectionRate}%`, color: COLORS.primary, icon: 'stats-chart-outline' },
      ].map((card, i) => (
        <View key={i} style={styles.summaryCard}>
          <Ionicons name={card.icon} size={18} color={card.color} />
          <Text style={[styles.summaryValue, { color: card.color }]}>{card.value}</Text>
          <Text style={styles.summaryLabel}>{card.label}</Text>
        </View>
      ))}
    </View>
  );

  const PeriodToggle = ({ value, onChange }) => (
    <View style={styles.toggleRow}>
      {[
        { key: 'monthly', label: '📅 Monthly' },
        { key: 'yearly', label: '📆 Yearly' },
      ].map(opt => (
        <TouchableOpacity key={opt.key} onPress={() => onChange(opt.key)}
          style={[styles.toggleBtn, value === opt.key && styles.toggleBtnActive]}>
          <Text style={[styles.toggleBtnText, value === opt.key && styles.toggleBtnTextActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const FeeRow = ({ fee }) => (
    <View style={styles.feeRow}>
      <View style={styles.feeAvatar}>
        <Text style={styles.feeAvatarText}>{fee.studentId?.userId?.name?.charAt(0)}</Text>
      </View>
      <View style={styles.feeInfo}>
        <Text style={styles.feeName}>{fee.studentId?.userId?.name}</Text>
        <Text style={styles.feeClass}>{fee.classId?.name}</Text>
        {fee.month && <Text style={styles.feeMonth}>{fee.month}</Text>}
      </View>
      <View style={styles.feeRight}>
        <Text style={styles.feeAmount}>Rs. {fee.amount?.toLocaleString()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[fee.status]?.bg || '#F5F5F5' }]}>
          <Text style={[styles.statusText, { color: statusColors[fee.status]?.text || COLORS.gray }]}>
            {fee.status}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
        <Text style={styles.headerSub}>Income & payment analytics</Text>
      </View>

      <ScrollView style={styles.scroll}>

        {/* Report type selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
          {[
            { key: 'income', icon: '📊', label: 'Income' },
            { key: 'teacher', icon: '👨‍🏫', label: 'Teacher' },
            { key: 'daterange', icon: '🗓️', label: 'Date Range' },
            { key: 'student', icon: '🔍', label: 'Student' },
          ].map(t => (
            <TouchableOpacity key={t.key} onPress={() => setReportType(t.key)}
              style={[styles.typeChip, reportType === t.key && styles.typeChipActive]}>
              <Text style={styles.typeChipIcon}>{t.icon}</Text>
              <Text style={[styles.typeChipText, reportType === t.key && styles.typeChipTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Income Report ── */}
        {reportType === 'income' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Income Report Settings</Text>
              <PeriodToggle value={incomePeriod} onChange={setIncomePeriod} />

              <Text style={styles.fieldLabel}>{incomePeriod === 'monthly' ? 'Select Month' : 'Select Year'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {incomePeriod === 'monthly' ? (
                  months.map(m => (
                    <TouchableOpacity key={m.value} onPress={() => setIncomeMonth(m.value)}
                      style={[styles.chip, incomeMonth === m.value && styles.chipActive]}>
                      <Text style={[styles.chipText, incomeMonth === m.value && styles.chipTextActive]}>{m.label}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  years.map(y => (
                    <TouchableOpacity key={y} onPress={() => setIncomeYear(y)}
                      style={[styles.chip, incomeYear === y && styles.chipActive]}>
                      <Text style={[styles.chipText, incomeYear === y && styles.chipTextActive]}>{y}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              <Text style={styles.fieldLabel}>🔍 Filter by Student</Text>
              <View style={styles.searchRow}>
                <Ionicons name="search" size={14} color={COLORS.gray} />
                <TextInput value={incomeSearch} onChangeText={setIncomeSearch}
                  placeholder="Name or admission number..."
                  placeholderTextColor={COLORS.gray} style={styles.searchInput}
                  autoCapitalize="none" autoCorrect={false} />
                {incomeSearch ? (
                  <TouchableOpacity onPress={() => setIncomeSearch('')}>
                    <Ionicons name="close-circle" size={14} color={COLORS.gray} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {loadingIncome ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : activeReport && (
              <>
                <SummaryCards data={activeReport} />

                {/* Download button */}
                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={() => downloadReport(
                    'Income Report',
                    generateIncomeHTML(activeReport, incomePeriod === 'monthly' ? incomeMonth : incomeYear)
                  )}
                >
                  <Ionicons name="download-outline" size={18} color={COLORS.white} />
                  <Text style={styles.downloadBtnText}>📥 Download PDF</Text>
                </TouchableOpacity>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>
                    Fee Records — {incomePeriod === 'monthly' ? incomeMonth : incomeYear}
                    {incomeSearch ? ' (filtered)' : ''}
                  </Text>
                  {filterBySearch(activeReport.records, incomeSearch)?.length === 0 ? (
                    <Text style={styles.noData}>No records found</Text>
                  ) : (
                    filterBySearch(activeReport.records, incomeSearch)?.map((fee, i) => (
                      <FeeRow key={i} fee={fee} />
                    ))
                  )}
                </View>
              </>
            )}
          </>
        )}

        {/* ── Teacher Report ── */}
        {reportType === 'teacher' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Teacher Report Settings</Text>
              <PeriodToggle value={teacherPeriod} onChange={setTeacherPeriod} />

              <Text style={styles.fieldLabel}>Select Teacher</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {teachers?.teachers?.map((t, i) => (
                  <TouchableOpacity key={i} onPress={() => setTeacherId(t._id)}
                    style={[styles.teacherChip, teacherId === t._id && styles.teacherChipActive]}>
                    <View style={styles.teacherChipAvatar}>
                      <Text style={styles.teacherChipAvatarText}>{t.userId?.name?.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={[styles.teacherChipName, teacherId === t._id && { color: COLORS.white }]}>
                        {t.userId?.name}
                      </Text>
                      <Text style={[styles.teacherChipSub, teacherId === t._id && { color: 'rgba(255,255,255,0.7)' }]}>
                        {t.subjectExpertise?.join(', ')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>{teacherPeriod === 'monthly' ? 'Select Month' : 'Select Year'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {teacherPeriod === 'monthly' ? (
                  months.map(m => (
                    <TouchableOpacity key={m.value} onPress={() => setTeacherMonth(m.value)}
                      style={[styles.chip, teacherMonth === m.value && styles.chipActive]}>
                      <Text style={[styles.chipText, teacherMonth === m.value && styles.chipTextActive]}>{m.label}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  years.map(y => (
                    <TouchableOpacity key={y} onPress={() => setTeacherYear(y)}
                      style={[styles.chip, teacherYear === y && styles.chipActive]}>
                      <Text style={[styles.chipText, teacherYear === y && styles.chipTextActive]}>{y}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              <TouchableOpacity
                style={[styles.generateBtn, (!teacherId || loadingTeacher) && styles.generateBtnDisabled]}
                onPress={fetchTeacherReport} disabled={!teacherId || loadingTeacher}>
                {loadingTeacher ? <ActivityIndicator color={COLORS.white} /> : (
                  <>
                    <Ionicons name="search" size={16} color={COLORS.white} />
                    <Text style={styles.generateBtnText}>
                      Generate {teacherPeriod === 'monthly' ? 'Monthly' : 'Yearly'} Teacher Report
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {teacherReportData && (
              <>
                <View style={[styles.card, { backgroundColor: COLORS.primary }]}>
                  <View style={styles.teacherHeaderRow}>
                    <View style={styles.teacherHeaderAvatar}>
                      <Text style={styles.teacherHeaderAvatarText}>{teacherReportData.teacher?.name?.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teacherHeaderName}>{teacherReportData.teacher?.name}</Text>
                      <Text style={styles.teacherHeaderEmail}>{teacherReportData.teacher?.email}</Text>
                      <Text style={styles.teacherHeaderPeriod}>
                        {teacherPeriod === 'monthly' ? `📅 ${teacherMonth}` : `📆 Year ${teacherYear}`}
                      </Text>
                    </View>
                  </View>
                </View>

                <SummaryCards data={teacherReportData} />

                {/* Download button */}
                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={() => downloadReport(
                    'Teacher Report',
                    generateTeacherHTML(teacherReportData, teacherPeriod === 'monthly' ? teacherMonth : teacherYear)
                  )}
                >
                  <Ionicons name="download-outline" size={18} color={COLORS.white} />
                  <Text style={styles.downloadBtnText}>📥 Download PDF</Text>
                </TouchableOpacity>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Class-wise Breakdown</Text>
                  {teacherReportData.classReports?.map((cls, i) => (
                    <View key={i} style={styles.clsRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.clsName}>{cls.className}</Text>
                        <Text style={styles.clsSubject}>{cls.subject}</Text>
                        <View style={styles.clsStats}>
                          <Text style={styles.clsStudents}>{cls.enrolledCount} students</Text>
                          <Text style={styles.clsGenerated}>Rs. {cls.totalGenerated?.toLocaleString()}</Text>
                          <Text style={styles.clsCollected}>✓ Rs. {cls.totalCollected?.toLocaleString()}</Text>
                        </View>
                      </View>
                      <View style={[styles.rateBadge, {
                        backgroundColor: cls.collectionRate >= 80 ? '#F0FBF7' :
                          cls.collectionRate >= 50 ? '#FFFBEB' : '#FEF2F2'
                      }]}>
                        <Text style={[styles.rateText, {
                          color: cls.collectionRate >= 80 ? '#10B981' :
                            cls.collectionRate >= 50 ? '#F59E0B' : '#EF4444'
                        }]}>
                          {cls.collectionRate}%
                        </Text>
                      </View>
                    </View>
                  ))}
                  <View style={[styles.clsRow, { backgroundColor: '#F0FBF7', borderRadius: 10, padding: 10, marginTop: 4 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.clsName, { color: COLORS.primary }]}>TOTAL</Text>
                      <View style={styles.clsStats}>
                        <Text style={[styles.clsGenerated, { fontWeight: '800' }]}>
                          Rs. {teacherReportData.totalGenerated?.toLocaleString()}
                        </Text>
                        <Text style={[styles.clsCollected, { fontWeight: '800' }]}>
                          ✓ Rs. {teacherReportData.totalCollected?.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.rateBadge, { backgroundColor: '#0d6b7a20' }]}>
                      <Text style={[styles.rateText, { color: COLORS.primary }]}>{teacherReportData.collectionRate}%</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </>
        )}

        {/* ── Date Range ── */}
        {reportType === 'daterange' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Date Range Settings</Text>
              <Text style={styles.fieldLabel}>From Date (YYYY-MM-DD)</Text>
              <TextInput value={dateFrom} onChangeText={setDateFrom}
                placeholder="e.g. 2026-04-01" placeholderTextColor={COLORS.gray}
                style={styles.dateInput} autoCapitalize="none" />
              <Text style={styles.fieldLabel}>To Date (YYYY-MM-DD)</Text>
              <TextInput value={dateTo} onChangeText={setDateTo}
                placeholder="e.g. 2026-04-30" placeholderTextColor={COLORS.gray}
                style={styles.dateInput} autoCapitalize="none" />
              <TouchableOpacity
                style={[styles.generateBtn, (!dateFrom || !dateTo || loadingDate) && styles.generateBtnDisabled]}
                onPress={fetchDateReport} disabled={!dateFrom || !dateTo || loadingDate}>
                {loadingDate ? <ActivityIndicator color={COLORS.white} /> : (
                  <>
                    <Ionicons name="search" size={16} color={COLORS.white} />
                    <Text style={styles.generateBtnText}>Generate Date Range Report</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {dateReportData && (
              <>
                <View style={styles.summaryGrid}>
                  {[
                    { label: 'Total Payments', value: dateReportData.totalPayments?.toString(), color: COLORS.dark, icon: 'card-outline' },
                    { label: 'Total Collected', value: `Rs. ${dateReportData.totalCollected?.toLocaleString()}`, color: '#10B981', icon: 'checkmark-circle-outline' },
                  ].map((card, i) => (
                    <View key={i} style={[styles.summaryCard, { width: '47%' }]}>
                      <Ionicons name={card.icon} size={18} color={card.color} />
                      <Text style={[styles.summaryValue, { color: card.color }]}>{card.value}</Text>
                      <Text style={styles.summaryLabel}>{card.label}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Daily Breakdown — {dateFrom} → {dateTo}</Text>
                  {dateReportData.byDate?.map((d, i) => (
                    <View key={i} style={styles.dateRow}>
                      <View>
                        <Text style={styles.dateRowDate}>{d.date}</Text>
                        <Text style={styles.dateRowCount}>{d.count} payment{d.count > 1 ? 's' : ''}</Text>
                      </View>
                      <Text style={styles.dateRowTotal}>Rs. {d.total?.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {/* ── Student Search ── */}
        {reportType === 'student' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Student Payment History</Text>
              <View style={styles.searchRow}>
                <Ionicons name="search" size={14} color={COLORS.gray} />
                <TextInput value={studentSearch}
                  onChangeText={text => { setStudentSearch(text); setShowStudentDropdown(true); }}
                  onFocus={() => setShowStudentDropdown(true)}
                  placeholder="Search by name or admission number..."
                  placeholderTextColor={COLORS.gray} style={styles.searchInput}
                  autoCapitalize="none" autoCorrect={false} />
                {studentSearch ? (
                  <TouchableOpacity onPress={() => { setStudentSearch(''); setSelectedStudentId(''); setShowStudentDropdown(false); }}>
                    <Ionicons name="close-circle" size={14} color={COLORS.gray} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {showStudentDropdown && studentSearch && filteredStudents.length > 0 && (
                <View style={styles.dropdown}>
                  {filteredStudents.map(s => (
                    <TouchableOpacity key={s._id}
                      onPress={() => {
                        setSelectedStudentId(s._id);
                        setStudentSearch(`${s.userId?.name} (${s.admissionNumber})`);
                        setShowStudentDropdown(false);
                      }}
                      style={styles.dropdownItem}>
                      <View style={styles.dropdownAvatar}>
                        <Text style={styles.dropdownAvatarText}>{s.userId?.name?.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text style={styles.dropdownName}>{s.userId?.name}</Text>
                        <Text style={styles.dropdownDetail}>{s.admissionNumber} • {s.grade}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {selectedStudentId && selectedStudent && (
              <>
                <View style={[styles.card, { backgroundColor: COLORS.primary }]}>
                  <View style={styles.teacherHeaderRow}>
                    <View style={styles.teacherHeaderAvatar}>
                      <Text style={styles.teacherHeaderAvatarText}>{selectedStudent.userId?.name?.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teacherHeaderName}>{selectedStudent.userId?.name}</Text>
                      <Text style={styles.teacherHeaderEmail}>{selectedStudent.admissionNumber} • {selectedStudent.grade}</Text>
                      <View style={styles.studentPaySummary}>
                        <Text style={styles.studentPaid}>
                          ✓ Rs. {(studentPayments?.fees?.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0) || 0).toLocaleString()} paid
                        </Text>
                        <Text style={styles.studentUnpaid}>
                          ✗ Rs. {(studentPayments?.fees?.filter(f => f.status !== 'paid').reduce((s, f) => s + f.amount, 0) || 0).toLocaleString()} due
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {loadingStudentPay ? (
                  <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
                ) : (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Payment History — {studentPayments?.fees?.length} records</Text>
                    <View style={styles.payBadges}>
                      <View style={styles.payBadgePaid}>
                        <Text style={styles.payBadgePaidText}>
                          ✓ {studentPayments?.fees?.filter(f => f.status === 'paid').length} Paid
                        </Text>
                      </View>
                      <View style={styles.payBadgeUnpaid}>
                        <Text style={styles.payBadgeUnpaidText}>
                          ✗ {studentPayments?.fees?.filter(f => f.status !== 'paid').length} Unpaid
                        </Text>
                      </View>
                    </View>
                    {studentPayments?.fees?.sort((a, b) => b.month?.localeCompare(a.month))?.map((fee, i) => (
                      <View key={i} style={styles.feeRow}>
                        <View style={styles.feeInfo}>
                          <Text style={styles.feeName}>{fee.month}</Text>
                          <Text style={styles.feeClass}>{fee.classId?.name}</Text>
                          <Text style={styles.feeMonth}>{fee.classId?.subject}</Text>
                        </View>
                        <View style={styles.feeRight}>
                          <Text style={styles.feeAmount}>Rs. {fee.amount?.toLocaleString()}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: statusColors[fee.status]?.bg || '#F5F5F5' }]}>
                            <Text style={[styles.statusText, { color: statusColors[fee.status]?.text || COLORS.gray }]}>
                              {fee.status}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { padding: 24, paddingTop: 56, paddingBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  scroll: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 16 },
  typeScroll: { paddingHorizontal: 16, marginBottom: 12 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    backgroundColor: COLORS.white, marginRight: 8, borderWidth: 1.5, borderColor: '#E0E0E0',
  },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipIcon: { fontSize: 16 },
  typeChipText: { fontSize: 13, fontWeight: '700', color: COLORS.gray },
  typeChipTextActive: { color: COLORS.white },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 16,
    marginBottom: 12, padding: 16, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  cardTitle: { fontSize: 13, fontWeight: '800', color: COLORS.dark, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  toggleRow: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 3, marginBottom: 12 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: COLORS.white, elevation: 2 },
  toggleBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  toggleBtnTextActive: { color: COLORS.primary, fontWeight: '800' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray, marginBottom: 8, marginTop: 12, textTransform: 'uppercase' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5', marginRight: 8, borderWidth: 1.5, borderColor: '#E0E0E0' },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  chipTextActive: { color: COLORS.white },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 10, marginTop: 8 },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.dark },
  dateInput: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, fontSize: 14, color: COLORS.dark, marginBottom: 4 },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, marginTop: 16,
  },
  generateBtnDisabled: { backgroundColor: COLORS.gray },
  generateBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#10B981', borderRadius: 12, padding: 14,
    marginHorizontal: 16, marginBottom: 12,
  },
  downloadBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 16, marginBottom: 12 },
  summaryCard: {
    width: '47%', backgroundColor: COLORS.white, borderRadius: 14, padding: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  summaryValue: { fontSize: 16, fontWeight: '800', marginTop: 6, marginBottom: 2 },
  summaryLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
  noData: { fontSize: 13, color: COLORS.gray, textAlign: 'center', padding: 12 },
  feeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  feeAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  feeAvatarText: { fontSize: 14, fontWeight: '800', color: COLORS.gold },
  feeInfo: { flex: 1 },
  feeName: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  feeClass: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  feeMonth: { fontSize: 11, color: COLORS.primary, marginTop: 1, fontWeight: '600' },
  feeRight: { alignItems: 'flex-end' },
  feeAmount: { fontSize: 13, fontWeight: '800', color: COLORS.dark },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  teacherChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#F5F5F5', marginRight: 8, borderWidth: 1.5, borderColor: '#E0E0E0', minWidth: 150,
  },
  teacherChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  teacherChipAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  teacherChipAvatarText: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  teacherChipName: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  teacherChipSub: { fontSize: 10, color: COLORS.gray, marginTop: 1 },
  teacherHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teacherHeaderAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  teacherHeaderAvatarText: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  teacherHeaderName: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  teacherHeaderEmail: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  teacherHeaderPeriod: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '600' },
  clsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  clsName: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  clsSubject: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  clsStats: { flexDirection: 'row', gap: 8, marginTop: 4 },
  clsStudents: { fontSize: 11, color: COLORS.gray },
  clsGenerated: { fontSize: 11, color: COLORS.dark },
  clsCollected: { fontSize: 11, color: '#10B981', fontWeight: '600' },
  rateBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, minWidth: 50, alignItems: 'center' },
  rateText: { fontSize: 14, fontWeight: '800' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  dateRowDate: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  dateRowCount: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  dateRowTotal: { fontSize: 15, fontWeight: '800', color: '#10B981' },
  dropdown: { backgroundColor: '#F5F5F5', borderRadius: 12, marginTop: 4, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  dropdownAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  dropdownAvatarText: { fontSize: 14, fontWeight: '800', color: COLORS.gold },
  dropdownName: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  dropdownDetail: { fontSize: 11, color: COLORS.gray },
  studentPaySummary: { flexDirection: 'row', gap: 12, marginTop: 4 },
  studentPaid: { fontSize: 12, color: '#90EE90', fontWeight: '600' },
  studentUnpaid: { fontSize: 12, color: '#FFB3B3', fontWeight: '600' },
  payBadges: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  payBadgePaid: { backgroundColor: '#F0FBF7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  payBadgePaidText: { fontSize: 12, color: '#10B981', fontWeight: '700' },
  payBadgeUnpaid: { backgroundColor: '#FEF2F2', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  payBadgeUnpaidText: { fontSize: 12, color: '#EF4444', fontWeight: '700' },
});

export default AdminReports;