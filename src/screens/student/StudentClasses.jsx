import { useState } from 'react';

import {

  View, Text, StyleSheet, ScrollView,

  TouchableOpacity, RefreshControl, ActivityIndicator,

  Modal, Alert, TextInput,

} from 'react-native';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Ionicons } from '@expo/vector-icons';

import api from '../../api/axios';

import { COLORS } from '../../utils/constants';



//  Helpers 

const generateMonths = (fees = []) => {

  const months = [];

  const now = new Date();

  // Only show current month and past 5 months (no future)

  for (let i = 5; i >= 0; i--) {

    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });

    const feeRecord = fees.find(f => f.month === value);

    months.push({

      value,

      label,

      isPaid: feeRecord?.status === 'paid',

      feeId: feeRecord?._id,

    });

  }

  return months;

};



const formatCardNumber = (text) => {

  const cleaned = text.replace(/\D/g, '').slice(0, 16);

  return cleaned.replace(/(.{4})/g, '$1 ').trim();

};



const formatExpiry = (text) => {

  const cleaned = text.replace(/\D/g, '').slice(0, 4);

  if (cleaned.length >= 3) return cleaned.slice(0, 2) + '/' + cleaned.slice(2);

  return cleaned;

};



const getCardType = (num) => {

  const n = num.replace(/\s/g, '');

  if (n.startsWith('4')) return 'VISA';

  if (n.startsWith('5')) return 'MASTERCARD';

  if (n.startsWith('3')) return 'AMEX';

  return 'CARD';

};



const getCardColors = (num) => {

  const type = getCardType(num);

  if (type === 'VISA') return { bg: '#1a1f71' };

  if (type === 'MASTERCARD') return { bg: '#eb001b' };

  if (type === 'AMEX') return { bg: '#007bc1' };

  return { bg: COLORS.primary };

};



//  Course Work Modal 

const CourseWorkModal = ({ cls, onClose }) => {

  const { data: courseWork, isLoading } = useQuery({

    queryKey: ['mobile-coursework', cls._id],

    queryFn: () => api.get(`/coursework/${cls._id}`).then(r => r.data),

  });



  const typeConfig = {

    recording: { icon: 'videocam-outline', color: '#3B82F6' },

    instruction: { icon: 'list-outline', color: '#10B981' },

    assignment: { icon: 'pencil-outline', color: '#F59E0B' },

    resource: { icon: 'attach-outline', color: '#8B5CF6' },

  };



  return (

    <Modal visible animationType="slide" presentationStyle="pageSheet">

      <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>

        <View style={cwStyles.header}>

          <Text style={cwStyles.title}>Course Work</Text>

          <Text style={cwStyles.subtitle}>{cls.name}</Text>

          <TouchableOpacity onPress={onClose} style={cwStyles.closeBtn}>

            <Ionicons name="close" size={24} color={COLORS.dark} />

          </TouchableOpacity>

        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

          {isLoading ? (

            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />

          ) : !courseWork?.length ? (

            <View style={{ alignItems: 'center', paddingTop: 60 }}>

              <Text style={{ fontSize: 48, marginBottom: 12 }}></Text>

              <Text style={{ color: COLORS.gray, fontSize: 16 }}>No course work yet</Text>

            </View>

          ) : courseWork.map((item, i) => {

            const cfg = typeConfig[item.type] || typeConfig.resource;

            return (

              <View key={i} style={cwStyles.card}>

                <View style={[cwStyles.iconBox, { backgroundColor: cfg.color + '20' }]}>

                  <Text style={{ fontSize: 22 }}>{cfg.icon}</Text>

                </View>

                <View style={{ flex: 1 }}>

                  <Text style={cwStyles.itemTitle}>{item.title}</Text>

                  {item.description && (

                    <Text style={cwStyles.itemDesc}>{item.description}</Text>

                  )}

                  <Text style={cwStyles.itemType}>{item.type?.toUpperCase()}</Text>

                </View>

              </View>

            );

          })}

          <View style={{ height: 40 }} />

        </ScrollView>

      </View>

    </Modal>

  );

};



const cwStyles = StyleSheet.create({

  header: {

    padding: 20, paddingTop: 56, backgroundColor: COLORS.white,

    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',

  },

  title: { fontSize: 22, fontWeight: '800', color: COLORS.dark },

  subtitle: { fontSize: 13, color: COLORS.gray, marginTop: 2 },

  closeBtn: {

    position: 'absolute', top: 52, right: 20,

    width: 36, height: 36, borderRadius: 18,

    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',

  },

  card: {

    backgroundColor: COLORS.white, borderRadius: 14, padding: 14,

    flexDirection: 'row', gap: 12, marginBottom: 10,

    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.06, shadowRadius: 8,

  },

  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  itemTitle: { fontSize: 14, fontWeight: '700', color: COLORS.dark },

  itemDesc: { fontSize: 12, color: COLORS.gray, marginTop: 2 },

  itemType: { fontSize: 10, color: COLORS.primary, fontWeight: '700', marginTop: 4 },

});



//  Fee Payment Modal 

const FeePaymentModal = ({ cls, onClose }) => {

  const queryClient = useQueryClient();

  const [selectedMonth, setSelectedMonth] = useState(null);

  const [method, setMethod] = useState('cash');

  const [loading, setLoading] = useState(false);

  const [cardNumber, setCardNumber] = useState('');

  const [cardHolder, setCardHolder] = useState('');

  const [cardExpiry, setCardExpiry] = useState('');

  const [cardCVV, setCardCVV] = useState('');

  const [cvvFocused, setCVVFocused] = useState(false);

  const [bankName, setBankName] = useState('');

  const [transactionRef, setTransactionRef] = useState('');

  const [notes, setNotes] = useState('');



  //  Fetch REAL fee records from backend 

  const { data: feesData, isLoading: feesLoading } = useQuery({

    queryKey: ['mobile-fees-student'],

    queryFn: () => api.get('/fees/student').then(r => r.data),

  });



  // Filter fees for THIS class only, current + past months

  const classFees = (feesData?.fees || []).filter(

    f => String(f.classId?._id || f.classId) === String(cls._id)

  );



  const unpaidFees = classFees.filter(f => f.status !== 'paid');

  const cardColors = getCardColors(cardNumber);



  const getSelectedFeeRecord = () =>

    classFees.find(f => f.month === selectedMonth && f.status !== 'paid');



  const getDisplayNumber = () => {

    const cleaned = cardNumber.replace(/\s/g, '');

    return cleaned.padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim();

  };



  const handleSubmit = async () => {

    if (!selectedMonth) return;



    if (method === 'cash') {

      Alert.alert(

        'Cash Payment',

        `Visit XenEdu counter.\nShow your Student ID barcode.\nPay Rs. ${cls.monthlyFee?.toLocaleString()} cash.\n\nPayment updates automatically! `,

        [{ text: 'Got it!', onPress: onClose }]

      );

      return;

    }



    if (method === 'card' && (!cardNumber || !cardHolder || !cardExpiry || !cardCVV)) {

      return Alert.alert('Error', 'Please fill in all card details');

    }

    if (method === 'bank_transfer' && (!bankName || !transactionRef)) {

      return Alert.alert('Error', 'Bank name and reference number are required');

    }



    setLoading(true);

    try {

      const selectedFee = getSelectedFeeRecord();

      const formData = new FormData();

      formData.append('classId', cls._id);

      formData.append('amount', cls.monthlyFee);

      formData.append('method', method);

      formData.append('month', selectedMonth);

      if (selectedFee?._id) formData.append('feeRecordId', selectedFee._id);



      if (method === 'card') {

        formData.append('cardHolderName', cardHolder);

        formData.append('cardLastFour', cardNumber.replace(/\s/g, '').slice(-4));

        formData.append('cardType', getCardType(cardNumber));

      }

      if (method === 'bank_transfer') {

        formData.append('bankName', bankName);

        formData.append('transactionRef', transactionRef);

        if (notes) formData.append('notes', notes);

      }



      const res = await api.post('/payment-requests', formData, {

        headers: { 'Content-Type': 'multipart/form-data' },

      });



      queryClient.invalidateQueries(['mobile-fees-student']);

      queryClient.invalidateQueries(['mobile-dashboard']);

      queryClient.invalidateQueries(['mobile-classes']);



      if (method === 'card' && res.data.autoApproved) {

        if (res.data.reEnrolled) {

          Alert.alert(

            'Payment Approved + Re-enrolled!',

            `Receipt: ${res.data.receiptNumber}\nAmount: Rs. ${cls.monthlyFee?.toLocaleString()}\n\n You have been re-enrolled in ${cls.name}!`,

            [{ text: 'OK', onPress: onClose }]

          );

        } else if (res.data.stillOwed?.length > 0) {

          Alert.alert(

            'Payment Approved',

            `Receipt: ${res.data.receiptNumber}\n\n Still need to pay:\n${res.data.stillOwed.join(', ')}\n\nRemaining: Rs. ${res.data.remainingAmount?.toLocaleString()}`,

            [{ text: 'OK', onPress: onClose }]

          );

        } else {

          Alert.alert('Payment Approved!', `Receipt: ${res.data.receiptNumber}`, [{ text: 'OK', onPress: onClose }]);

        }

      } else {

        Alert.alert('Submitted!', 'Admin will verify and approve within 24 hours.', [{ text: 'OK', onPress: onClose }]);

      }

    } catch (err) {

      Alert.alert('Error', err.response?.data?.message || 'Submission failed');

    } finally {

      setLoading(false);

    }

  };



  const getSubmitLabel = () => {

    if (!selectedMonth) return 'Select a month first';

    if (method === 'cash') return 'View Counter Instructions';

    if (method === 'card') return ` Pay Rs. ${cls.monthlyFee?.toLocaleString()} Now`;

    return 'Submit Bank Transfer';

  };



  return (

    <Modal visible animationType="slide" presentationStyle="pageSheet">

      <View style={payStyles.container}>

        <View style={payStyles.header}>

          <View>

            <Text style={payStyles.title}>Pay Fee</Text>

            <Text style={payStyles.subtitle}>{cls.name} - Rs. {cls.monthlyFee?.toLocaleString()}/month</Text>

          </View>

          <TouchableOpacity onPress={onClose} style={payStyles.closeBtn}>

            <Ionicons name="close" size={24} color={COLORS.dark} />

          </TouchableOpacity>

        </View>



        <ScrollView style={payStyles.scroll} contentContainerStyle={payStyles.scrollContent}>



          {/* Multiple unpaid warning */}

          {unpaidFees.length > 1 && (

            <View style={payStyles.warningBanner}>

              <Ionicons name="warning" size={18} color="#92400E" />

              <Text style={payStyles.warningText}>

                You have {unpaidFees.length} unpaid months. Clear all dues to avoid unenrollment.

              </Text>

            </View>

          )}



          {/* Fee records from backend */}

          <Text style={payStyles.sectionTitle}> Select Month</Text>

          {feesLoading ? (

            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />

          ) : classFees.length === 0 ? (

            <View style={payStyles.noFeesBox}>

              <Ionicons name="checkmark-circle" size={32} color="#10B981" />

              <Text style={payStyles.noFeesText}>No fee records found for this class</Text>

            </View>

          ) : (

            classFees

              .sort((a, b) => a.month.localeCompare(b.month)) // oldest first

              .map(fee => (

                <TouchableOpacity

                  key={fee._id}

                  onPress={() => fee.status !== 'paid' && setSelectedMonth(fee.month)}

                  disabled={fee.status === 'paid'}

                  style={[

                    payStyles.monthBtn,

                    selectedMonth === fee.month && payStyles.monthBtnSelected,

                    fee.status === 'paid' && payStyles.monthBtnPaid,

                    fee.status === 'overdue' && payStyles.monthBtnOverdue,

                  ]}

                >

                  <View>

                    <Text style={[

                      payStyles.monthLabel,

                      selectedMonth === fee.month && { color: COLORS.primary }

                    ]}>

                      {new Date(fee.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}

                    </Text>

                    <Text style={payStyles.monthFee}>Rs. {fee.amount?.toLocaleString()}</Text>

                  </View>

                  <View style={[

                    payStyles.monthStatus,

                    fee.status === 'paid' ? payStyles.paidStatus :

                    fee.status === 'overdue' ? payStyles.overdueStatus : payStyles.unpaidStatus,

                  ]}>

                    <Text style={[

                      payStyles.monthStatusText,

                      { color: fee.status === 'paid' ? '#10B981' : fee.status === 'overdue' ? '#DC2626' : '#EF4444' }

                    ]}>

                      {fee.status === 'paid' ? ' Paid' : fee.status === 'overdue' ? ' Overdue' : 'Unpaid'}

                    </Text>

                  </View>

                </TouchableOpacity>

              ))

          )}



          {/* Payment method */}

          <Text style={payStyles.sectionTitle}> Payment Method</Text>

          <View style={payStyles.methodRow}>

            {[

              { key: 'cash', label: 'Cash', icon: 'cash-outline' },

              { key: 'card', label: 'Card', icon: 'card-outline' },

              { key: 'bank_transfer', label: 'Bank', icon: 'business-outline' },

            ].map(m => (

              <TouchableOpacity

                key={m.key}

                onPress={() => setMethod(m.key)}

                style={[payStyles.methodBtn, method === m.key && payStyles.methodBtnActive]}

              >

                <Ionicons name={m.icon} size={24} color={method === m.key ? COLORS.primary : COLORS.gray} style={{marginBottom: 4}} />

                <Text style={[payStyles.methodLabel, method === m.key && { color: COLORS.primary }]}>

                  {m.label}

                </Text>

              </TouchableOpacity>

            ))}

          </View>



          {/* CASH */}

          {method === 'cash' && (

            <View style={payStyles.infoBox}>

              <Text style={payStyles.infoTitle}> How Cash Payment Works</Text>

              {[

                'Visit XenEdu institute counter',

                'Show your Student ID barcode',

                `Pay Rs. ${cls.monthlyFee?.toLocaleString()} cash to cashier`,

                'Payment updates automatically!',

              ].map((step, i) => (

                <View key={i} style={payStyles.stepRow}>

                  <View style={payStyles.stepNum}><Text style={payStyles.stepNumText}>{i + 1}</Text></View>

                  <Text style={payStyles.stepText}>{step}</Text>

                </View>

              ))}

              <Text style={payStyles.infoNote}> 033-2242-2589</Text>

            </View>

          )}



          {/* CARD */}

          {method === 'card' && (

            <View>

              <View style={cardStyles.amountBanner}>

                <Text style={cardStyles.amountLabel}>Amount to Pay</Text>

                <Text style={cardStyles.amountValue}>Rs. {cls.monthlyFee?.toLocaleString()}</Text>

                <Text style={cardStyles.amountSub}>{cls.name} • {selectedMonth || 'Select month above'}</Text>

              </View>

              <View style={[cardStyles.cardPreview, { backgroundColor: cardColors.bg }]}>

                {cvvFocused ? (

                  <View style={StyleSheet.absoluteFillObject}>

                    <View style={cardStyles.cvvStripe} />

                    <View style={cardStyles.cvvRow}>

                      <Text style={cardStyles.cvvLabel}>CVV</Text>

                      <View style={cardStyles.cvvBox}>

                        <Text style={cardStyles.cvvBoxText}>{'•'.repeat(cardCVV.length || 3)}</Text>

                      </View>

                    </View>

                  </View>

                ) : (

                  <>

                    <View style={cardStyles.cardTop}>

                      <View style={cardStyles.chipRow}>

                        {[0,1,2,3].map(i => <View key={i} style={cardStyles.chipDot} />)}

                      </View>

                      <Text style={cardStyles.cardTypeText}>{getCardType(cardNumber)}</Text>

                    </View>

                    <Text style={cardStyles.cardNumberDisplay}>{getDisplayNumber()}</Text>

                    <View style={cardStyles.cardBottom}>

                      <View>

                        <Text style={cardStyles.cardFieldLabel}>CARD HOLDER</Text>

                        <Text style={cardStyles.cardFieldValue}>{cardHolder.toUpperCase() || 'FULL NAME'}</Text>

                      </View>

                      <View style={{ alignItems: 'flex-end' }}>

                        <Text style={cardStyles.cardFieldLabel}>EXPIRES</Text>

                        <Text style={cardStyles.cardFieldValue}>{cardExpiry || 'MM/YY'}</Text>

                      </View>

                    </View>

                  </>

                )}

              </View>

              <View style={cardStyles.form}>

                <View>

                  <Text style={cardStyles.fieldLabel}>Card Number</Text>

                  <View style={cardStyles.inputRow}>

                    <Ionicons name="card-outline" size={16} color={COLORS.gray} />

                    <TextInput value={cardNumber} onChangeText={t => setCardNumber(formatCardNumber(t))}

                      placeholder="1234 5678 9012 3456" placeholderTextColor={COLORS.gray}

                      style={cardStyles.input} keyboardType="numeric" maxLength={19} />

                  </View>

                </View>

                <View>

                  <Text style={cardStyles.fieldLabel}>Cardholder Name</Text>

                  <View style={cardStyles.inputRow}>

                    <Ionicons name="person-outline" size={16} color={COLORS.gray} />

                    <TextInput value={cardHolder} onChangeText={setCardHolder}

                      placeholder="John Silva" placeholderTextColor={COLORS.gray}

                      style={cardStyles.input} autoCapitalize="words" />

                  </View>

                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>

                  <View style={{ flex: 1 }}>

                    <Text style={cardStyles.fieldLabel}>Expiry</Text>

                    <View style={cardStyles.inputRow}>

                      <Ionicons name="calendar-outline" size={16} color={COLORS.gray} />

                      <TextInput value={cardExpiry} onChangeText={t => setCardExpiry(formatExpiry(t))}

                        placeholder="MM/YY" placeholderTextColor={COLORS.gray}

                        style={cardStyles.input} keyboardType="numeric" maxLength={5} />

                    </View>

                  </View>

                  <View style={{ flex: 1 }}>

                    <Text style={cardStyles.fieldLabel}>CVV</Text>

                    <View style={[cardStyles.inputRow, cvvFocused && { borderColor: COLORS.primary, borderWidth: 2 }]}>

                      <Ionicons name="lock-closed-outline" size={16} color={COLORS.gray} />

                      <TextInput value={cardCVV} onChangeText={t => setCardCVV(t.replace(/\D/g,'').slice(0,3))}

                        placeholder="" placeholderTextColor={COLORS.gray} style={cardStyles.input}

                        keyboardType="numeric" maxLength={3} secureTextEntry

                        onFocus={() => setCVVFocused(true)} onBlur={() => setCVVFocused(false)} />

                    </View>

                  </View>

                </View>

                <View style={cardStyles.securityBadge}>

                  <Ionicons name="shield-checkmark" size={15} color="#10B981" />

                  <Text style={cardStyles.securityText}>256-bit SSL encrypted. Your card details are secure.</Text>

                </View>

                <View style={cardStyles.acceptedRow}>

                  <Text style={cardStyles.acceptedLabel}>Accepted:</Text>

                  {['VISA', 'MASTERCARD', 'AMEX'].map(card => (

                    <View key={card} style={[cardStyles.cardBadge, getCardType(cardNumber) === card && cardStyles.cardBadgeActive]}>

                      <Text style={[cardStyles.cardBadgeText, getCardType(cardNumber) === card && cardStyles.cardBadgeTextActive]}>{card}</Text>

                    </View>

                  ))}

                </View>

              </View>

            </View>

          )}



          {/* BANK TRANSFER */}

          {method === 'bank_transfer' && (

            <View style={payStyles.infoBox}>

              <Text style={payStyles.infoTitle}> Bank Transfer Details</Text>

              <View style={payStyles.bankDetails}>

                <Text style={payStyles.bankDetailRow}> Bank of Ceylon</Text>

                <Text style={payStyles.bankDetailRow}> Account: 1234-5678-9012</Text>

                <Text style={payStyles.bankDetailRow}> Branch: Mirigama</Text>

                <Text style={payStyles.bankDetailRow}> XenEdu Institute</Text>

                <Text style={[payStyles.bankDetailRow, { color: COLORS.primary, fontWeight: '700', marginTop: 4 }]}>

                   Amount: Rs. {cls.monthlyFee?.toLocaleString()}

                </Text>

              </View>

              <Text style={payStyles.fieldLabel}>Your Bank Name *</Text>

              <TextInput value={bankName} onChangeText={setBankName}

                placeholder="e.g. Bank of Ceylon..." placeholderTextColor={COLORS.gray}

                style={payStyles.textInput} autoCapitalize="words" />

              <Text style={payStyles.fieldLabel}>Transaction Reference *</Text>

              <TextInput value={transactionRef} onChangeText={setTransactionRef}

                placeholder="e.g. TXN123456789" placeholderTextColor={COLORS.gray}

                style={payStyles.textInput} autoCapitalize="characters" />

              <Text style={payStyles.fieldLabel}>Notes (Optional)</Text>

              <TextInput value={notes} onChangeText={setNotes}

                placeholder="Any additional info..." placeholderTextColor={COLORS.gray}

                style={[payStyles.textInput, { minHeight: 70, textAlignVertical: 'top' }]} multiline />

              <View style={payStyles.cardNote}>

                <Ionicons name="information-circle" size={14} color={COLORS.primary} />

                <Text style={payStyles.cardNoteText}>Admin will verify and approve within 24 hours.</Text>

              </View>

            </View>

          )}



          {/* Submit */}

          <TouchableOpacity

            style={[

              payStyles.submitBtn,

              (!selectedMonth || loading) && payStyles.submitBtnDisabled,

              method === 'card' && selectedMonth && { backgroundColor: cardColors.bg },

            ]}

            onPress={handleSubmit}

            disabled={!selectedMonth || loading}

          >

            {loading ? <ActivityIndicator color="white" /> : <Text style={payStyles.submitBtnText}>{getSubmitLabel()}</Text>}

          </TouchableOpacity>

          <View style={{ height: 40 }} />

        </ScrollView>

      </View>

    </Modal>

  );

};



const payStyles = StyleSheet.create({

  container: { flex: 1, backgroundColor: '#F5F5F5' },

  header: {

    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',

    padding: 20, paddingTop: 56, backgroundColor: COLORS.white,

    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',

  },

  title: { fontSize: 22, fontWeight: '800', color: COLORS.dark },

  subtitle: { fontSize: 13, color: COLORS.gray, marginTop: 2 },

  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1 },

  scrollContent: { padding: 16 },

  warningBanner: {

    flexDirection: 'row', alignItems: 'center', gap: 10,

    backgroundColor: '#FFF9E6', borderRadius: 12, padding: 12,

    marginBottom: 12, borderWidth: 1, borderColor: '#F5C518',

  },

  warningText: { flex: 1, fontSize: 13, color: '#92400E', fontWeight: '600' },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.dark, marginBottom: 10, marginTop: 16, textTransform: 'uppercase' },

  monthBtn: {

    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',

    backgroundColor: COLORS.white, borderRadius: 12, padding: 14,

    marginBottom: 8, borderWidth: 2, borderColor: '#F0F0F0',

  },

  monthBtnSelected: { borderColor: COLORS.primary, backgroundColor: '#F0FBF7' },

  monthBtnPaid: { opacity: 0.6 },

  monthLabel: { fontSize: 15, fontWeight: '600', color: COLORS.dark },

  monthFee: { fontSize: 12, color: COLORS.gray, marginTop: 2 },

  monthStatus: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },

  paidStatus: { backgroundColor: '#F0FBF7' },

  unpaidStatus: { backgroundColor: '#FEF2F2' },

  monthStatusText: { fontSize: 12, fontWeight: '700' },

  methodRow: { flexDirection: 'row', gap: 8 },

  methodBtn: {

    flex: 1, alignItems: 'center', padding: 14,

    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 2, borderColor: '#F0F0F0',

  },

  methodBtnActive: { borderColor: COLORS.primary, backgroundColor: '#F0FBF7' },

  methodIcon: { fontSize: 24, marginBottom: 4 },

  methodLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray },

  infoBox: {

    backgroundColor: '#F0FBF7', borderRadius: 12, padding: 14, marginTop: 12,

    borderWidth: 1, borderColor: '#C8EDE2',

  },

  infoTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 12 },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },

  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },

  stepNumText: { color: COLORS.white, fontWeight: '800', fontSize: 12 },

  stepText: { fontSize: 13, color: COLORS.dark, flex: 1 },

  infoNote: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 8 },

  bankDetails: { backgroundColor: 'rgba(13,107,122,0.08)', borderRadius: 8, padding: 10, marginBottom: 12 },

  bankDetailRow: { fontSize: 13, color: COLORS.dark, marginBottom: 4, fontWeight: '500' },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.dark, marginBottom: 6, marginTop: 10, textTransform: 'uppercase' },

  textInput: {

    backgroundColor: COLORS.white, borderRadius: 10, padding: 12,

    fontSize: 14, color: COLORS.dark, borderWidth: 1.5, borderColor: '#C8EDE2',

  },

  cardNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 10 },

  cardNoteText: { fontSize: 12, color: COLORS.primary, flex: 1, lineHeight: 18 },

  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },

  submitBtnDisabled: { backgroundColor: COLORS.gray },

  submitBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700', textAlign: 'center' },

  noFeesBox: { alignItems: 'center', padding: 24, gap: 8 },

  noFeesText: { fontSize: 14, color: COLORS.gray, fontWeight: '600' },

  overdueStatus: { backgroundColor: '#FEF2F2' },

  monthBtnOverdue: { borderColor: '#DC2626', backgroundColor: '#FFF5F5' },

});



const cardStyles = StyleSheet.create({

  amountBanner: {

    backgroundColor: COLORS.white, borderRadius: 14, padding: 16,

    alignItems: 'center', marginTop: 12, borderWidth: 1.5, borderColor: COLORS.primary,

  },

  amountLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '600', marginBottom: 4 },

  amountValue: { fontSize: 28, fontWeight: '800', color: COLORS.primary },

  amountSub: { fontSize: 12, color: COLORS.gray, marginTop: 4 },

  cardPreview: {

    borderRadius: 18, padding: 22, marginTop: 16, marginBottom: 4,

    minHeight: 190, justifyContent: 'space-between',

    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },

    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10, overflow: 'hidden',

  },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  chipRow: { flexDirection: 'row', gap: 5 },

  chipDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.45)' },

  cardTypeText: { fontSize: 15, fontWeight: '800', color: COLORS.white, letterSpacing: 2 },

  cardNumberDisplay: { fontSize: 20, fontWeight: '600', color: COLORS.white, letterSpacing: 3, marginVertical: 16 },

  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },

  cardFieldLabel: { fontSize: 9, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, marginBottom: 3 },

  cardFieldValue: { fontSize: 13, fontWeight: '700', color: COLORS.white, letterSpacing: 1 },

  cvvStripe: { height: 48, backgroundColor: 'rgba(0,0,0,0.6)', marginTop: 28, marginBottom: 16 },

  cvvRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },

  cvvLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },

  cvvBox: { flex: 1, backgroundColor: COLORS.white, borderRadius: 6, padding: 10, alignItems: 'center' },

  cvvBoxText: { fontSize: 18, fontWeight: '800', color: COLORS.dark, letterSpacing: 6 },

  form: { gap: 12, marginTop: 12 },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },

  inputRow: {

    flexDirection: 'row', alignItems: 'center', gap: 10,

    backgroundColor: COLORS.white, borderRadius: 12, padding: 13,

    borderWidth: 1.5, borderColor: '#E0E0E0',

  },

  input: { flex: 1, fontSize: 15, color: COLORS.dark },

  securityBadge: {

    flexDirection: 'row', alignItems: 'center', gap: 8,

    backgroundColor: '#F0FBF7', borderRadius: 10, padding: 10,

    borderWidth: 1, borderColor: '#C8EDE2',

  },

  securityText: { fontSize: 12, color: '#10B981', flex: 1 },

  acceptedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  acceptedLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },

  cardBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },

  cardBadgeActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },

  cardBadgeText: { fontSize: 11, fontWeight: '800', color: COLORS.gray },

  cardBadgeTextActive: { color: COLORS.white },

});



//  Main Component 

const StudentClasses = () => {

  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('enrolled');

  const [selectedClass, setSelectedClass] = useState(null);

  const [payClass, setPayClass] = useState(null);



  const { data: classes, isLoading, refetch } = useQuery({

    queryKey: ['mobile-classes'],

    queryFn: () => api.get('/classes').then(r => r.data),

  });



  const { data: dashboard } = useQuery({

    queryKey: ['mobile-dashboard'],

    queryFn: () => api.get('/dashboard/student').then(r => r.data),

  });



  const enrollMutation = useMutation({

    mutationFn: (classId) => api.post(`/classes/${classId}/enroll`),

    onSuccess: () => {

      queryClient.invalidateQueries(['mobile-classes']);

      queryClient.invalidateQueries(['mobile-dashboard']);

    },

    onError: (err) => {

      Alert.alert('Error', err.response?.data?.message || 'Enrollment failed');

    },

  });



  const enrolledIds = dashboard?.enrolledClasses?.map(c => String(c.classId)) ?? [];

  const allClasses = classes?.classes ?? [];

  const enrolledClasses = allClasses.filter(c => enrolledIds.includes(String(c._id)));

  const browseClasses = allClasses.filter(c => !enrolledIds.includes(String(c._id)));

  const displayClasses = activeTab === 'enrolled' ? enrolledClasses : browseClasses;



  return (

    <View style={styles.container}>

      {selectedClass && <CourseWorkModal cls={selectedClass} onClose={() => setSelectedClass(null)} />}

      {payClass && <FeePaymentModal cls={payClass} onClose={() => setPayClass(null)} />}



      <View style={styles.header}>

        <Text style={styles.headerTitle}>My Classes</Text>

        <Text style={styles.headerSub}>Manage your enrolled classes</Text>

      </View>



      <View style={styles.tabRow}>

        {[

          { key: 'enrolled', label: `Enrolled (${enrolledClasses.length})` },

          { key: 'browse', label: 'Browse All' },

        ].map(t => (

          <TouchableOpacity key={t.key} onPress={() => setActiveTab(t.key)}

            style={[styles.tab, activeTab === t.key && styles.tabActive]}>

            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>

              {t.label}

            </Text>

          </TouchableOpacity>

        ))}

      </View>



      <ScrollView

        style={styles.scroll}

        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}

      >

        {isLoading ? (

          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />

        ) : displayClasses.length === 0 ? (

          <View style={styles.emptyContainer}>

            <Ionicons name="book-outline" size={48} color={COLORS.gray} style={{marginBottom: 12}} />

            <Text style={styles.emptyText}>

              {activeTab === 'enrolled' ? 'No classes enrolled yet' : 'No classes available'}

            </Text>

            {activeTab === 'enrolled' && (

              <TouchableOpacity onPress={() => setActiveTab('browse')} style={styles.browseBtn}>

                <Text style={styles.browseBtnText}>Browse Classes</Text>

              </TouchableOpacity>

            )}

          </View>

        ) : (

          displayClasses.map((cls, i) => {

            const isEnrolled = enrolledIds.includes(String(cls._id));

            const attData = dashboard?.enrolledClasses?.find(c => String(c.classId) === String(cls._id));

            return (

              <View key={i} style={[styles.classCard, isEnrolled && styles.classCardEnrolled]}>

                <View style={styles.classHeader}>

                  <View style={styles.classIconBox}>

                    <Ionicons name="book-outline" size={24} color={COLORS.primary} />

                  </View>

                  <View style={styles.classInfo}>

                    <Text style={styles.className}>{cls.name}</Text>

                    <Text style={styles.classSubject}>{cls.subject} • {cls.grade} • {cls.medium}</Text>

                  </View>

                  {isEnrolled && (

                    <View style={styles.enrolledBadge}>

                      <Ionicons name="checkmark" size={16} color={COLORS.white} />

                    </View>

                  )}

                </View>



                <View style={styles.classDetails}>

                  <View style={styles.detailRow}>

                    <Ionicons name="person-outline" size={14} color={COLORS.gray} />

                    <Text style={styles.detailText}>{cls.teacherId?.userId?.name || 'Not assigned'}</Text>

                  </View>

                  <View style={styles.detailRow}>

                    <Ionicons name="time-outline" size={14} color={COLORS.gray} />

                    <Text style={styles.detailText}>{cls.schedule?.dayOfWeek} at {cls.schedule?.startTime}</Text>

                  </View>

                  <View style={styles.detailRow}>

                    <Ionicons name="location-outline" size={14} color={COLORS.gray} />

                    <Text style={styles.detailText}>{cls.hall}</Text>

                  </View>

                  <View style={styles.detailRow}>

                    <Ionicons name="card-outline" size={14} color={COLORS.gray} />

                    <Text style={[styles.detailText, { fontWeight: '700', color: COLORS.primary }]}>

                      Rs. {cls.monthlyFee?.toLocaleString()}/month

                    </Text>

                  </View>

                </View>



                {isEnrolled && attData && (

                  <View style={styles.attContainer}>

                    <View style={styles.attRow}>

                      <Text style={styles.attLabel}>Attendance</Text>

                      <Text style={[styles.attPct, { color: attData.atRisk ? '#EF4444' : '#10B981' }]}>

                        {attData.percentage}

                      </Text>

                    </View>

                    <View style={styles.attBar}>

                      <View style={[styles.attFill, {

                        width: attData.percentage,

                        backgroundColor: attData.atRisk ? '#EF4444' : '#10B981',

                      }]} />

                    </View>

                    {attData.atRisk && (

                      <Text style={styles.attWarning}> Below minimum attendance</Text>

                    )}

                  </View>

                )}



                <View style={styles.actionRow}>

                  {isEnrolled ? (

                    <>

                      <TouchableOpacity style={styles.cwBtn} onPress={() => setSelectedClass(cls)}>

                        <Ionicons name="book-outline" size={14} color={COLORS.primary} />

                        <Text style={styles.cwBtnText}>Course Work</Text>

                      </TouchableOpacity>

                      <TouchableOpacity style={styles.payBtn} onPress={() => setPayClass(cls)}>

                        <Ionicons name="card-outline" size={14} color="white" />

                        <Text style={styles.payBtnText}>Pay Fee</Text>

                      </TouchableOpacity>

                    </>

                  ) : (

                    <TouchableOpacity

                      style={[styles.enrollBtn, cls.availableSlots <= 0 && styles.enrollBtnDisabled]}

                      onPress={() => enrollMutation.mutate(cls._id)}

                      disabled={cls.availableSlots <= 0 || enrollMutation.isPending}

                    >

                      {enrollMutation.isPending

                        ? <ActivityIndicator color="white" size="small" />

                        : <Text style={styles.enrollBtnText}>

                            {cls.availableSlots <= 0 ? 'Class Full' : 'Enroll Now'}

                          </Text>

                      }

                    </TouchableOpacity>

                  )}

                </View>

              </View>

            );

          })

        )}

        <View style={{ height: 24 }} />

      </ScrollView>

    </View>

  );

};



const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: COLORS.primary },

  header: { padding: 24, paddingTop: 56, paddingBottom: 16 },

  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.white },

  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  tabRow: {

    flexDirection: 'row', marginHorizontal: 20, marginBottom: 0,

    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 4,

  },

  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },

  tabActive: { backgroundColor: COLORS.white },

  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },

  tabTextActive: { color: COLORS.primary },

  scroll: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: 16, paddingTop: 16 },

  emptyContainer: { alignItems: 'center', paddingTop: 60 },

  emptyIcon: { fontSize: 48, marginBottom: 12 },

  emptyText: { fontSize: 16, color: COLORS.gray, fontWeight: '600' },

  browseBtn: { marginTop: 16, backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },

  browseBtnText: { color: COLORS.white, fontWeight: '700' },

  classCard: { backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, padding: 16, elevation: 2 },

  classCardEnrolled: { borderWidth: 2, borderColor: COLORS.primary },

  classHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },

  classIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0FBF7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },

  classIconText: { fontSize: 22 },

  classInfo: { flex: 1 },

  className: { fontSize: 15, fontWeight: '700', color: COLORS.dark },

  classSubject: { fontSize: 12, color: COLORS.gray, marginTop: 2 },

  enrolledBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },

  enrolledBadgeText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },

  classDetails: { gap: 6, marginBottom: 12 },

  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  detailText: { fontSize: 13, color: COLORS.gray },

  attContainer: { marginBottom: 12 },

  attRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },

  attLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },

  attPct: { fontSize: 12, fontWeight: '700' },

  attBar: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3 },

  attFill: { height: 6, borderRadius: 3 },

  attWarning: { fontSize: 11, color: '#EF4444', marginTop: 4, fontWeight: '600' },

  actionRow: { flexDirection: 'row', gap: 8 },

  enrollBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },

  enrollBtnDisabled: { backgroundColor: COLORS.gray },

  enrollBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  cwBtn: { flex: 1, backgroundColor: '#F0FBF7', borderRadius: 10, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.primary },

  cwBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },

  payBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },

  payBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },

});



export default StudentClasses;



