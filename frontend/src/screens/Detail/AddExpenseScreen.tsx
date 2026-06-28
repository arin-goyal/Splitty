import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Pressable,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MainTabParamList } from '../../navigation/AppNavigator';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../../theme/colors';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { useFriendStore } from '../../store/friendStore';
import { User, Group } from '../../types';
import TabSlider from '../../components/TabSlider';
import GroupListItem from '../../components/GroupListItem';
import FriendListItem from '../../components/FriendListItem';
import CreateGroupModal from '../../components/CreateGroupModal';
import DateTimePickerModal from '../../components/DateTimePickerModal';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';

const EMOJI_OPTIONS = ['🍿', '🎮', '✈️', '🎓', '💊', '🍔', '💡', '💅', '🐾', '🏡', '🚕', '🛍️', '🍕', '💰'];

// Custom SVG Icons
const DocumentIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#B1CDC1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <Path d="M14 2v6h6" />
    <Path d="M16 13H8M16 17H8M10 9H8" />
  </Svg>
);

const MicIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#B1CDC1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <Path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8" />
  </Svg>
);

const ArrowIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#5A7268" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m6 9 6 6 6-6" />
  </Svg>
);

const CalendarIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#5A7268" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 4H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM16 2v4M8 2v4M3 10h18" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#060D10" strokeWidth={3}>
    <Path d="M20 6 9 17l-5-5" />
  </Svg>
);

const ArrowIconLeft = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#B1CDC1" strokeWidth={2.5}>
    <Path d="m15 19-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const cleanDescription = (desc: string | null | undefined) => {
  if (!desc) return '';
  return desc.replace(/\s*\(Paid by [^)]+\)$/, '').trim();
};

export default function AddExpenseScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MainTabParamList, 'AddExpense'>>();
  const editExpense = (route.params as any)?.editExpense as import('../../types').Expense | undefined;

  const { 
    categories, 
    fetchCategories, 
    createExpense,
    updateExpense,
    createCategory, 
    groups, 
    fetchGroups, 
    createGroup, 
    addMemberToGroup, 
    createGroupExpense,
    deleteGroupExpense,
    isLoading, 
    error 
  } = useAppStore();

  const { friends, fetchFriends, setAddFriendVisible } = useFriendStore();
  const { user } = useAuthStore();

  const [currentEditExpense, setCurrentEditExpense] = useState<import('../../types').Expense | null>(null);
  const [currentRelatedExpenses, setCurrentRelatedExpenses] = useState<import('../../types').Expense[] | null>(null);

  // Refs to avoid stale closures in the navigation listener
  const editExpenseRef = useRef(editExpense);
  editExpenseRef.current = editExpense;

  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;

  const userRef = useRef(user);
  userRef.current = user;

  const groupsRef = useRef(groups);
  groupsRef.current = groups;

  const paramsRef = useRef<any>(null);
  paramsRef.current = route.params;

  const amountInputRef = useRef<TextInput>(null);

  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getFormattedDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Today, 8:42 PM';
      const now = new Date();
      const isToday = d.getDate() === now.getDate() &&
                      d.getMonth() === now.getMonth() &&
                      d.getFullYear() === now.getFullYear();
      
      const datePart = isToday ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric'});
      const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return `${datePart}, ${timePart}`;
    } catch {
      return 'Today, 8:42 PM';
    }
  };

  // Form Fields
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString());
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [expenseType, setExpenseType] = useState<'personal' | 'group'>('personal');

  // Group / Friends Selection
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedFriends, setSelectedFriends] = useState<User[]>([]);

  // Modals Visibility
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);
  const [isAddCategoryVisible, setIsAddCategoryVisible] = useState(false);
  const [isGroupFriendsPickerVisible, setIsGroupFriendsPickerVisible] = useState(false);
  const [isPayerModalVisible, setIsPayerModalVisible] = useState(false);
  const [isSplitModalVisible, setIsSplitModalVisible] = useState(false);
  const [isCreateGroupVisible, setIsCreateGroupVisible] = useState(false);
  const [isDateTimePickerVisible, setIsDateTimePickerVisible] = useState(false);

  // Modal Input States
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('🍿');
  const [inputWidth, setInputWidth] = useState(130);

  // Payer Split configuration states
  const [payerMode, setPayerMode] = useState<'single' | 'multiple-equal' | 'multiple-unequal'>('single');
  const [singlePayerId, setSinglePayerId] = useState<string>('');
  const [payersEqualChecked, setPayersEqualChecked] = useState<Record<string, boolean>>({});
  const [payersUnequalData, setPayersUnequalData] = useState<Record<string, string>>({});

  const [splitMode, setSplitMode] = useState<'equal' | 'unequal'>('equal');
  const [splitsEqualChecked, setSplitsEqualChecked] = useState<Record<string, boolean>>({});
  const [splitsUnequalData, setSplitsUnequalData] = useState<Record<string, string>>({});

  // Digital Receipt State hooks
  const [isEditingDigitalReceipt, setIsEditingDigitalReceipt] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedMerchant, setScannedMerchant] = useState('');
  const [scannedDate, setScannedDate] = useState(() => new Date().toISOString());
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [scannedTaxes, setScannedTaxes] = useState<number>(0);

  // Item split state hooks
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isItemSplitModalVisible, setIsItemSplitModalVisible] = useState(false);
  const [itemSplitMode, setItemSplitMode] = useState<'equal' | 'unequal'>('equal');
  const [itemConsumersChecked, setItemConsumersChecked] = useState<Record<string, boolean>>({});
  const [itemConsumersUnequalData, setItemConsumersUnequalData] = useState<Record<string, string>>({});

  // Fetch data on mount
  useEffect(() => {
    fetchCategories();
    fetchGroups();
    fetchFriends();
  }, []);

  // Reset fields on screen focus — skip reset if coming in with an editExpense param
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // If editExpense is in params, pre-fill fields instead of resetting
      const params = paramsRef.current;
      const expenseToEdit = params?.editExpense;
      const relatedExpenses: import('../../types').Expense[] | undefined = params?.relatedExpenses;

      if (expenseToEdit) {
        setCurrentEditExpense(expenseToEdit);
        if (relatedExpenses && relatedExpenses.length > 1) {
          setCurrentRelatedExpenses(relatedExpenses);
          const totalAmount = relatedExpenses.reduce((sum, e) => sum + e.amount, 0);
          setAmount(String(totalAmount));
          
          const overallDescription = expenseToEdit.description 
            ? expenseToEdit.description.replace(/\s*\(Paid by [^)]+\)$/, '').trim() 
            : '';
          setDescription(overallDescription);
          setMerchant(expenseToEdit.merchant || '');
          setDate(expenseToEdit.date || new Date().toISOString());
          setSelectedCategoryId(expenseToEdit.categoryId || '');

          // Check if it's a group expense
          const ge = expenseToEdit.groupExpense;
          if (ge) {
            setExpenseType('group');
            const matchedGroup = groupsRef.current.find(g => g.id === ge.groupId) || null;
            setSelectedGroup(matchedGroup);
            setSelectedFriends([]);

            // Payer aggregation
            const payerAmounts: Record<string, number> = {};
            relatedExpenses.forEach((re) => {
              const geObj = re.groupExpense;
              if (geObj) {
                payerAmounts[geObj.paidByUserId] = (payerAmounts[geObj.paidByUserId] || 0) + re.amount;
              }
            });

            const payerIds = Object.keys(payerAmounts);
            const payerValues = Object.values(payerAmounts);
            const allPayersEqual = payerValues.every((val) => Math.abs(val - payerValues[0]) < 0.05);

            if (allPayersEqual && payerIds.length > 1) {
              setPayerMode('multiple-equal');
              const checked: Record<string, boolean> = {};
              payerIds.forEach(id => { checked[id] = true; });
              setPayersEqualChecked(checked);
              setPayersUnequalData({});
            } else {
              setPayerMode('multiple-unequal');
              const unequalData: Record<string, string> = {};
              payerIds.forEach(id => { unequalData[id] = String(payerAmounts[id]); });
              setPayersUnequalData(unequalData);
              setPayersEqualChecked({});
            }

            // Split aggregation
            const splitAmounts: Record<string, number> = {};
            relatedExpenses.forEach((re) => {
              const geObj = re.groupExpense;
              if (geObj) {
                geObj.splits.forEach((s) => {
                  splitAmounts[s.personId] = (splitAmounts[s.personId] || 0) + s.amount;
                });
              }
            });

            const splitEntries = Object.entries(splitAmounts).filter(([_, val]) => val > 0);
            const splitValues = splitEntries.map(([_, val]) => val);
            const allSplitsEqual = splitValues.every((val) => Math.abs(val - splitValues[0]) < 0.05);

            if (allSplitsEqual) {
              setSplitMode('equal');
              const checked: Record<string, boolean> = {};
              splitEntries.forEach(([id, _]) => { checked[id] = true; });
              setSplitsEqualChecked(checked);
              setSplitsUnequalData({});
            } else {
              setSplitMode('unequal');
              const unequalData: Record<string, string> = {};
              splitEntries.forEach(([id, val]) => { unequalData[id] = String(val); });
              setSplitsUnequalData(unequalData);
              setSplitsEqualChecked({});
            }
          }
        } else {
          setCurrentRelatedExpenses(null);
          setAmount(String(expenseToEdit.amount));
          setMerchant(expenseToEdit.merchant || '');
          setDescription(cleanDescription(expenseToEdit.description));
          setDate(expenseToEdit.date || new Date().toISOString());
          setSelectedCategoryId(expenseToEdit.categoryId || '');

          const ge = expenseToEdit.groupExpense;
          if (ge) {
            setExpenseType('group');
            const matchedGroup = groupsRef.current.find(g => g.id === ge.groupId) || null;
            setSelectedGroup(matchedGroup);
            setSelectedFriends([]);
            setPayerMode('single');
            setSinglePayerId(ge.paidByUserId);
          } else {
            setExpenseType('personal');
            setSelectedGroup(null);
            setSelectedFriends([]);
          }
        }
      } else {
        setCurrentEditExpense(null);
        setCurrentRelatedExpenses(null);
        setAmount('');
        setMerchant('');
        setDescription('');
        setDate(new Date().toISOString());
        if (categoriesRef.current.length > 0) {
          setSelectedCategoryId(categoriesRef.current[0].id);
        } else {
          setSelectedCategoryId('');
        }
        setExpenseType('personal');
        setSelectedGroup(null);
        setSelectedFriends([]);
        setPayerMode('single');
        if (userRef.current) {
          setSinglePayerId(userRef.current.id);
        } else {
          setSinglePayerId('');
        }
      }

      setIsCategoryPickerVisible(false);
      setIsAddCategoryVisible(false);
      setIsGroupFriendsPickerVisible(false);
      setIsPayerModalVisible(false);
      setIsSplitModalVisible(false);
      setIsCreateGroupVisible(false);
      setIsDateTimePickerVisible(false);
      if (!expenseToEdit?.groupExpense) {
        setPayerMode('single');
        if (userRef.current) {
          setSinglePayerId(userRef.current.id);
        } else {
          setSinglePayerId('');
        }
      }
      setPayersEqualChecked({});
      setPayersUnequalData({});
      setSplitMode('equal');
      setSplitsEqualChecked({});
      setSplitsUnequalData({});

      setIsEditingDigitalReceipt(false);
      setIsScanning(false);
      setScannedMerchant('');
      setScannedDate(new Date().toISOString());
      setScannedItems([]);
      setScannedTaxes(0);

      // Clear the param so that subsequent focuses (like via the tab bar) start with a blank form
      navigation.setParams({ editExpense: undefined, relatedExpenses: undefined } as any);
    });
    return unsubscribe;
  }, [navigation]);



  // Keyboard hide listener to blur amount input and remove cursor
  useEffect(() => {
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        amountInputRef.current?.blur();
      }
    );
    return () => {
      hideSubscription.remove();
    };
  }, []);

  // Set default category
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories]);

  // Set default payer to self when user loads
  useEffect(() => {
    if (user && !singlePayerId) {
      setSinglePayerId(user.id);
    }
  }, [user]);

  // Dynamically compute participants array
  const participants = React.useMemo<User[]>(() => {
    if (selectedGroup) {
      return selectedGroup.members.map((m: any) => m.user).filter(Boolean);
    }
    if (selectedFriends.length > 0) {
      return user ? [user, ...selectedFriends] : selectedFriends;
    }
    return user ? [user] : [];
  }, [selectedGroup, selectedFriends, user]);

  // Whenever participants change, initialize/update checkboxes
  useEffect(() => {
    const checked: Record<string, boolean> = {};
    const payerChecked: Record<string, boolean> = {};
    participants.forEach((p) => {
      checked[p.id] = true;
      payerChecked[p.id] = true;
    });
    setSplitsEqualChecked(checked);
    setPayersEqualChecked(payerChecked);
  }, [participants]);

  const handleAmountPress = () => {
    if (amountInputRef.current) {
      amountInputRef.current.blur();
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 50);
    }
  };

  const getPayerLabel = () => {
    if (payerMode === 'single') {
      if (singlePayerId === user?.id) return 'you';
      const payer = participants.find((p) => p.id === singlePayerId);
      return payer ? payer.name.split(' ')[0] : 'payer';
    }
    if (payerMode === 'multiple-equal') return 'multiple';
    return 'custom';
  };

  const getSplitLabel = () => {
    return splitMode === 'equal' ? 'equally' : 'unequally';
  };

  const handleClosePayerModal = () => {
    if (payerMode === 'multiple-equal') {
      const checkedCount = Object.values(payersEqualChecked).filter(Boolean).length;
      if (checkedCount === 0) {
        setPayerMode('single');
        const defaultPayerId = user?.id || (participants.length > 0 ? participants[0].id : '');
        if (!singlePayerId) {
          setSinglePayerId(defaultPayerId);
        }
      }
    } else if (payerMode === 'multiple-unequal') {
      const activeCount = participants.filter(p => {
        const val = parseFloat(payersUnequalData[p.id] || '0');
        return !isNaN(val) && val > 0;
      }).length;
      if (activeCount === 0) {
        setPayerMode('single');
        const defaultPayerId = user?.id || (participants.length > 0 ? participants[0].id : '');
        if (!singlePayerId) {
          setSinglePayerId(defaultPayerId);
        }
      }
    }
    setIsPayerModalVisible(false);
  };

  const handleCloseAddCategory = () => {
    setIsAddCategoryVisible(false);
    setNewCategoryName('');
    setNewCategoryIcon('🍿');
  };

  const handleScanReceipt = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your camera to take a photo of your receipt.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setIsScanning(true);

      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;

      const response = await api.post('/ai/scan-receipt', {
        image: base64Image,
      });

      const parsedReceipt = response.data.data;
      
      setScannedMerchant(parsedReceipt.merchant || '');
      setScannedDate(parsedReceipt.date ? new Date(parsedReceipt.date).toISOString() : new Date().toISOString());
      setMerchant(parsedReceipt.merchant || '');
      setDescription(parsedReceipt.merchant ? `${parsedReceipt.merchant} (AI Scan)` : 'AI Receipt Scan');
      
      if (categoriesRef.current.length > 0) {
        setSelectedCategoryId(categoriesRef.current[0].id);
      }
      
      const initialItems = (parsedReceipt.items || []).map((item: any, idx: number) => {
        const defaultConsumers: Record<string, boolean> = {};
        participants.forEach(p => {
          defaultConsumers[p.id] = true;
        });

        return {
          id: `item-${idx}-${Date.now()}`,
          name: item.name || `Item ${idx + 1}`,
          quantity: item.quantity || 1,
          price: item.price || 0,
          splitMode: 'equal',
          consumers: defaultConsumers,
          customAmounts: {},
        };
      });

      setScannedItems(initialItems);
      setScannedTaxes(parsedReceipt.taxes || 0);
      setIsEditingDigitalReceipt(true);

    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || 'Failed to scan receipt. Please try again.';
      Alert.alert('Scanning Failed', msg);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for the custom category.');
      return;
    }
    const newCat = await createCategory(newCategoryName.trim(), newCategoryIcon);
    if (newCat) {
      setSelectedCategoryId(newCat.id);
      handleCloseAddCategory();
    } else {
      Alert.alert('Error', error || 'Failed to create category.');
    }
  };

  const handleCreateGroupSubmit = async (name: string, icon: string, selectedFriendIds: string[]) => {
    const created = await createGroup(name, icon);
    if (created) {
      for (const memberId of selectedFriendIds) {
        await addMemberToGroup(created.id, memberId);
      }
      const updatedGroup = await useAppStore.getState().fetchGroupDetails(created.id);
      setSelectedGroup(updatedGroup || created);
      setSelectedFriends([]);
      fetchGroups();
      return true;
    } else {
      Alert.alert('Error', 'Failed to create group.');
      return false;
    }
  };

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount greater than 0.');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('Category Required', 'Please select a category for this expense.');
      return;
    }

    let finalDateStr = date;
    if (date && date.length === 10 && !date.includes('T')) {
      const parts = date.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          const finalDate = new Date();
          finalDate.setFullYear(year, month, day);
          finalDateStr = finalDate.toISOString();
        }
      }
    }

    if (expenseType === 'personal') {
      // Edit mode: update existing expense
      if (currentEditExpense) {
        const updated = await updateExpense(currentEditExpense.id, {
          amount: parsedAmount,
          categoryId: selectedCategoryId,
          description: description || undefined,
          merchant: merchant || undefined,
          date: finalDateStr,
        });
        if (updated) {
          navigation.goBack();
        } else {
          Alert.alert('Error', error || 'Failed to update expense. Please try again.');
        }
        return;
      }

      const success = await createExpense({
        amount: parsedAmount,
        categoryId: selectedCategoryId,
        description: description || undefined,
        merchant: merchant || undefined,
        date: finalDateStr,
      });

      if (success) {
        navigation.goBack();
      } else {
        Alert.alert('Error', error || 'Failed to create expense. Please try again.');
      }
      return;
    }

    // Group expense creation (or edit)
    if (!selectedGroup && selectedFriends.length === 0) {
      Alert.alert('Group or Friends Required', 'Please select a group or friends to split with.');
      return;
    }

    // If editing a group expense, delete the old one first — we'll re-create below
    if (currentEditExpense && currentEditExpense.groupExpense) {
      if (currentRelatedExpenses && currentRelatedExpenses.length > 1) {
        // Delete all related expenses
        const groupId = currentEditExpense.groupExpense.groupId;
        for (const re of currentRelatedExpenses) {
          const deleted = await deleteGroupExpense(groupId, re.id);
          if (!deleted) {
            Alert.alert('Error', 'Failed to update group expense. Could not remove old related expense.');
            return;
          }
        }
      } else {
        const deleted = await deleteGroupExpense(currentEditExpense.groupExpense.groupId, currentEditExpense.id);
        if (!deleted) {
          Alert.alert('Error', 'Failed to update group expense. Could not remove old expense.');
          return;
        }
      }
    }

    let targetGroupId = selectedGroup?.id || '';

    // If ad-hoc friends are selected, create the group first
    if (!targetGroupId && selectedFriends.length > 0) {
      const groupName = `Ad-hoc with ${selectedFriends.map(f => f.name.split(' ')[0]).join(', ')}`;
      const created = await createGroup(groupName, '👥');
      if (!created) {
        Alert.alert('Error', 'Failed to create group for friends split.');
        return;
      }
      targetGroupId = created.id;
      for (const friend of selectedFriends) {
        await addMemberToGroup(targetGroupId, friend.id);
      }
    }

    // Payer selection calculation
    let payerPayments: { personId: string; amount: number }[] = [];
    if (payerMode === 'single') {
      payerPayments = [{ personId: singlePayerId, amount: parsedAmount }];
    } else if (payerMode === 'multiple-equal') {
      const activePayers = participants.filter(p => payersEqualChecked[p.id]);
      if (activePayers.length === 0) {
        Alert.alert('Payer Required', 'Please select at least one payer.');
        return;
      }
      const share = parsedAmount / activePayers.length;
      payerPayments = activePayers.map(p => ({ personId: p.id, amount: share }));
    } else {
      const payments = participants.map(p => {
        const val = parseFloat(payersUnequalData[p.id] || '0');
        return { personId: p.id, amount: isNaN(val) ? 0 : val };
      }).filter(p => p.amount > 0);

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalPaid - parsedAmount) > 0.05) {
        Alert.alert('Invalid Payers', `Total paid must equal ₹${parsedAmount}. Currently ₹${totalPaid}.`);
        return;
      }
      payerPayments = payments;
    }

    // Split configuration calculation
    let splitShares: { personId: string; amount: number }[] = [];
    if (splitMode === 'equal') {
      const activeSplitters = participants.filter(p => splitsEqualChecked[p.id]);
      if (activeSplitters.length === 0) {
        Alert.alert('Splitter Required', 'Please select at least one person to split with.');
        return;
      }
      const share = parsedAmount / activeSplitters.length;
      splitShares = participants.map(p => ({
        personId: p.id,
        amount: splitsEqualChecked[p.id] ? share : 0,
      }));
    } else {
      const shares = participants.map(p => {
        const val = parseFloat(splitsUnequalData[p.id] || '0');
        return { personId: p.id, amount: isNaN(val) ? 0 : val };
      });
      const totalSplit = shares.reduce((sum, s) => sum + s.amount, 0);
      if (Math.abs(totalSplit - parsedAmount) > 0.05) {
        Alert.alert('Invalid Splits', `Total splits must equal ₹${parsedAmount}. Currently ₹${totalSplit}.`);
        return;
      }
      splitShares = shares;
    }

    // Submit Expenses
    try {
      if (payerPayments.length === 1) {
        const payer = payerPayments[0];
        const success = await createGroupExpense({
          groupId: targetGroupId,
          amount: payer.amount,
          categoryId: selectedCategoryId,
          description: description || undefined,
          merchant: merchant || undefined,
          splitType: 'custom',
          customSplits: splitShares,
          paidByUserId: payer.personId,
          date: finalDateStr,
        });

        if (success) {
          navigation.goBack();
        } else {
          Alert.alert('Error', error || 'Failed to create group expense.');
        }
      } else {
        // Multi payer split
        let count = 0;
        for (const payer of payerPayments) {
          const ratio = payer.amount / parsedAmount;
          const customSplits = splitShares.map(s => ({
            personId: s.personId,
            amount: s.amount * ratio,
          }));

          const payerName = participants.find(p => p.id === payer.personId)?.name.split(' ')[0] || 'Member';
          const success = await createGroupExpense({
            groupId: targetGroupId,
            amount: payer.amount,
            categoryId: selectedCategoryId,
            description: `${description || 'Group expense'} (Paid by ${payerName})`,
            merchant: merchant || undefined,
            splitType: 'custom',
            customSplits,
            paidByUserId: payer.personId,
            date: finalDateStr,
          });

          if (success) {
            count++;
          }
        }

        if (count === payerPayments.length) {
          navigation.goBack();
        } else {
          Alert.alert('Partial Success', 'Some expense payments could not be recorded.');
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'An unexpected error occurred while creating group expense.');
    }
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  // Unequal split total sum helper
  const totalUnequalSplitSum = React.useMemo(() => {
    return participants.reduce((sum, p) => {
      const val = parseFloat(splitsUnequalData[p.id] || '0');
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [splitsUnequalData, participants]);

  // Unequal payers total sum helper
  const totalUnequalPayerSum = React.useMemo(() => {
    return participants.reduce((sum, p) => {
      const val = parseFloat(payersUnequalData[p.id] || '0');
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [payersUnequalData, participants]);

  const handleSaveDigitalReceipt = async (calculatedTotal: number, shares: Record<string, number>) => {
    if (calculatedTotal <= 0) {
      Alert.alert('Empty Bill', 'Your bill total must be greater than 0.');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('Category Required', 'Please select a category.');
      return;
    }

    if (expenseType === 'personal') {
      const success = await createExpense({
        amount: calculatedTotal,
        categoryId: selectedCategoryId,
        description: description || scannedMerchant || 'AI Receipt Scan',
        merchant: scannedMerchant || undefined,
        date: scannedDate,
      });

      if (success) {
        navigation.goBack();
      } else {
        Alert.alert('Error', error || 'Failed to save personal expense.');
      }
      return;
    }

    // Group split saving
    if (!selectedGroup && selectedFriends.length === 0) {
      Alert.alert('Group or Friends Required', 'Please select a group or friends to split with.');
      return;
    }

    let targetGroupId = selectedGroup?.id || '';

    // If ad-hoc friends are selected, create the group first
    if (!targetGroupId && selectedFriends.length > 0) {
      const groupName = `Ad-hoc with ${selectedFriends.map(f => f.name.split(' ')[0]).join(', ')}`;
      const created = await createGroup(groupName, '👥');
      if (!created) {
        Alert.alert('Error', 'Failed to create group for friends split.');
        return;
      }
      targetGroupId = created.id;
      for (const friend of selectedFriends) {
        await addMemberToGroup(targetGroupId, friend.id);
      }
    }

    // Payer selection calculation (reused from standard onSubmit)
    let payerPayments: { personId: string; amount: number }[] = [];
    if (payerMode === 'single') {
      payerPayments = [{ personId: singlePayerId, amount: calculatedTotal }];
    } else if (payerMode === 'multiple-equal') {
      const activePayers = participants.filter(p => payersEqualChecked[p.id]);
      if (activePayers.length === 0) {
        Alert.alert('Payer Required', 'Please select at least one payer.');
        return;
      }
      const share = calculatedTotal / activePayers.length;
      payerPayments = activePayers.map(p => ({ personId: p.id, amount: share }));
    } else {
      const payments = participants.map(p => {
        const val = parseFloat(payersUnequalData[p.id] || '0');
        return { personId: p.id, amount: isNaN(val) ? 0 : val };
      }).filter(p => p.amount > 0);

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalPaid - calculatedTotal) > 0.05) {
        Alert.alert('Invalid Payers', `Total paid must equal ₹${calculatedTotal.toFixed(2)}. Currently ₹${totalPaid.toFixed(2)}.`);
        return;
      }
      payerPayments = payments;
    }

    // Split configuration shares from our computed `shares` object
    const splitShares = participants.map(p => ({
      personId: p.id,
      amount: shares[p.id] || 0,
    }));

    try {
      if (payerPayments.length === 1) {
        const payer = payerPayments[0];
        const success = await createGroupExpense({
          groupId: targetGroupId,
          amount: payer.amount,
          categoryId: selectedCategoryId,
          description: description || scannedMerchant || 'AI Group Receipt Split',
          merchant: scannedMerchant || undefined,
          splitType: 'custom',
          customSplits: splitShares,
          paidByUserId: payer.personId,
          date: scannedDate,
        });

        if (success) {
          navigation.goBack();
        } else {
          Alert.alert('Error', error || 'Failed to create group expense.');
        }
      } else {
        // Multi payer split
        let count = 0;
        for (const payer of payerPayments) {
          const ratio = payer.amount / calculatedTotal;
          const customSplits = splitShares.map(s => ({
            personId: s.personId,
            amount: s.amount * ratio,
          }));

          const payerName = participants.find(p => p.id === payer.personId)?.name.split(' ')[0] || 'Member';
          const success = await createGroupExpense({
            groupId: targetGroupId,
            amount: payer.amount,
            categoryId: selectedCategoryId,
            description: `${description || scannedMerchant || 'AI Group Receipt Split'} (Paid by ${payerName})`,
            merchant: scannedMerchant || undefined,
            splitType: 'custom',
            customSplits,
            paidByUserId: payer.personId,
            date: scannedDate,
          });

          if (success) {
            count++;
          }
        }

        if (count === payerPayments.length) {
          navigation.goBack();
        } else {
          Alert.alert('Partial Success', 'Some expense payments could not be recorded.');
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'An unexpected error occurred while saving the group expense.');
    }
  };

  const renderDigitalReceiptEditor = () => {
    const totalItemsCost = scannedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalBillCalculated = totalItemsCost + (parseFloat(String(scannedTaxes)) || 0);

    // Compute active split shares per person
    const shares: Record<string, number> = {};
    scannedItems.forEach((item) => {
      const itemCost = item.price * item.quantity;
      if (item.splitMode === 'equal') {
        const checkedCount = Object.values(item.consumers).filter(Boolean).length;
        if (checkedCount > 0) {
          const share = itemCost / checkedCount;
          participants.forEach((p) => {
            if (item.consumers[p.id]) {
              shares[p.id] = (shares[p.id] || 0) + share;
            }
          });
        }
      } else {
        participants.forEach((p) => {
          if (item.consumers[p.id]) {
            const amt = parseFloat(item.customAmounts[p.id] || '0') || 0;
            shares[p.id] = (shares[p.id] || 0) + amt;
          }
        });
      }
    });

    const taxes = parseFloat(String(scannedTaxes)) || 0;
    if (totalItemsCost > 0 && taxes > 0) {
      participants.forEach((p) => {
        const itemShare = shares[p.id] || 0;
        const taxShare = taxes * (itemShare / totalItemsCost);
        shares[p.id] = itemShare + taxShare;
      });
    }

    return (
      <View style={{ flex: 1 }}>
        {/* Receipt Header Actions */}
        <View style={styles.receiptHeader}>
          <TouchableOpacity 
            style={styles.receiptBackBtn} 
            onPress={() => setIsEditingDigitalReceipt(false)}
          >
            <ArrowIconLeft />
            <Text style={styles.receiptBackBtnText}>Cancel Scan</Text>
          </TouchableOpacity>
          <Text style={styles.receiptHeaderTitle}>Digitalized Bill</Text>
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Paper Receipt container */}
          <View style={styles.paperReceiptCard}>
            {/* Merchant Name & Date */}
            <View style={styles.receiptSection}>
              <TextInput
                style={styles.receiptMerchantInput}
                value={scannedMerchant}
                onChangeText={setScannedMerchant}
                placeholder="Merchant Name"
                placeholderTextColor="#5A7268"
              />
              <TouchableOpacity
                style={styles.receiptDateButton}
                onPress={() => setIsDateTimePickerVisible(true)}
              >
                <CalendarIcon />
                <Text style={styles.receiptDateText}>
                  {getFormattedDateTime(scannedDate)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.receiptDashedLine} />

            {/* Items List */}
            <View style={styles.receiptItemsHeaderRow}>
              <Text style={styles.receiptSectionTitle}>Items</Text>
              <TouchableOpacity 
                style={styles.receiptAddIconBtn}
                onPress={() => {
                  const defaultConsumers: Record<string, boolean> = {};
                  participants.forEach(p => { defaultConsumers[p.id] = true; });
                  setScannedItems([
                    ...scannedItems,
                    {
                      id: `item-new-${Date.now()}`,
                      name: '',
                      quantity: 1,
                      price: 0,
                      splitMode: 'equal',
                      consumers: defaultConsumers,
                      customAmounts: {},
                    }
                  ]);
                }}
              >
                <Text style={styles.receiptAddIconBtnText}>+ Add Item</Text>
              </TouchableOpacity>
            </View>

            {scannedItems.length === 0 ? (
              <Text style={styles.receiptEmptyItemsText}>No items added yet</Text>
            ) : (
              scannedItems.map((item, idx) => {
                const activeCount = Object.values(item.consumers).filter(Boolean).length;
                let consumersText = 'Not split';
                if (activeCount > 0) {
                  if (item.splitMode === 'equal') {
                    consumersText = activeCount === participants.length 
                      ? 'Split equally (Everyone)' 
                      : `Split equally (${activeCount} people)`;
                  } else {
                    consumersText = `Split custom (${activeCount} people)`;
                  }
                }

                return (
                  <View key={item.id} style={styles.receiptItemRowContainer}>
                    <View style={styles.receiptItemMainRow}>
                      <TextInput
                        style={[styles.receiptItemInput, { flex: 2 }]}
                        value={item.name}
                        onChangeText={(name) => {
                          const updated = [...scannedItems];
                          updated[idx].name = name;
                          setScannedItems(updated);
                        }}
                        placeholder="Item Name"
                        placeholderTextColor="#5A7268"
                      />
                      <TextInput
                        style={[styles.receiptItemInput, { flex: 0.5, textAlign: 'center' }]}
                        value={String(item.quantity)}
                        keyboardType="number-pad"
                        onChangeText={(qty) => {
                          const updated = [...scannedItems];
                          updated[idx].quantity = parseInt(qty.replace(/[^0-9]/g, '')) || 0;
                          setScannedItems(updated);
                        }}
                        placeholder="Qty"
                        placeholderTextColor="#5A7268"
                      />
                      <TextInput
                        style={[styles.receiptItemInput, { flex: 1, textAlign: 'right' }]}
                        value={item.price === 0 && !String(item.price).includes('.') ? '' : String(item.price)}
                        keyboardType="decimal-pad"
                        onChangeText={(price) => {
                          const cleanPrice = price.replace(/[^0-9.]/g, '');
                          const updated = [...scannedItems];
                          updated[idx].price = parseFloat(cleanPrice) || 0;
                          setScannedItems(updated);
                        }}
                        placeholder="Price"
                        placeholderTextColor="#5A7268"
                      />
                      <TouchableOpacity
                        style={styles.receiptItemDeleteBtn}
                        onPress={() => {
                          setScannedItems(scannedItems.filter((_, i) => i !== idx));
                        }}
                      >
                        <Text style={styles.receiptItemDeleteBtnText}>×</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Consumer/Split button (Only if Group) */}
                    {expenseType === 'group' && (
                      <TouchableOpacity
                        style={styles.itemSplitPill}
                        onPress={() => {
                          setEditingItemIndex(idx);
                          setItemSplitMode(item.splitMode || 'equal');
                          setItemConsumersChecked({ ...item.consumers });
                          setItemConsumersUnequalData({ ...item.customAmounts });
                          setIsItemSplitModalVisible(true);
                        }}
                      >
                        <Text style={itemSplitPillText(activeCount)}>🎯 {consumersText}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}

            <View style={styles.receiptDashedLine} />

            {/* Taxes and Total block */}
            <View style={styles.receiptSummaryBlock}>
              <View style={styles.receiptSummaryRow}>
                <Text style={styles.receiptSummaryLabel}>Subtotal</Text>
                <Text style={styles.receiptSummaryValue}>₹{totalItemsCost.toFixed(2)}</Text>
              </View>

              <View style={styles.receiptSummaryRow}>
                <Text style={styles.receiptSummaryLabel}>Taxes / Fees</Text>
                <TextInput
                  style={styles.receiptTaxesInput}
                  value={scannedTaxes === 0 && !String(scannedTaxes).includes('.') ? '' : String(scannedTaxes)}
                  keyboardType="decimal-pad"
                  onChangeText={(val) => {
                    const cleanVal = val.replace(/[^0-9.]/g, '');
                    setScannedTaxes(parseFloat(cleanVal) || 0);
                  }}
                  placeholder="0.00"
                  placeholderTextColor="#5A7268"
                />
              </View>

              <View style={styles.receiptSummaryRow}>
                <Text style={styles.receiptSummaryTotalLabel}>Total Bill</Text>
                <Text style={styles.receiptSummaryTotalValue}>₹{totalBillCalculated.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Group / Personal slider */}
          <View style={styles.receiptSliderWrapper}>
            <TabSlider
              tabs={['Personal', 'Group']}
              activeIndex={expenseType === 'personal' ? 0 : 1}
              onChange={(idx) => {
                setExpenseType(idx === 0 ? 'personal' : 'group');
                if (idx === 1 && !selectedGroup && selectedFriends.length === 0) {
                  setIsGroupFriendsPickerVisible(true);
                }
              }}
              style={{ width: 200, marginBottom: 20 }}
            />
          </View>

          {/* If Group, render Group details selectors */}
          {expenseType === 'group' && (
            <View style={styles.receiptGroupContainer}>
              <TouchableOpacity
                style={styles.groupSelectorRow}
                onPress={() => setIsGroupFriendsPickerVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.groupSelectorLabel}>Split with:</Text>
                <View style={styles.groupSelectorPill}>
                  <Text style={styles.groupSelectorText} numberOfLines={1}>
                    {selectedGroup 
                      ? `${selectedGroup.icon || '👥'} ${selectedGroup.name}` 
                      : selectedFriends.length > 0 
                        ? `👥 ${selectedFriends.length} Friends` 
                        : 'Select Group / Friends'}
                  </Text>
                  <ArrowIcon />
                </View>
              </TouchableOpacity>

              {/* Who Paid Selector */}
              <View style={[styles.splitRow, { marginBottom: 20, justifyContent: 'center' }]}>
                <Text style={styles.splitLabel}>Paid by </Text>
                <TouchableOpacity
                  style={styles.splitPill}
                  onPress={() => setIsPayerModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.splitPillText}>{getPayerLabel()}</Text>
                </TouchableOpacity>
              </View>

              {/* Participant splits breakdown */}
              <Text style={styles.breakdownHeaderTitle}>Calculated Splits (proportional tax included)</Text>
              <View style={styles.breakdownCard}>
                {participants.map((p) => {
                  const share = shares[p.id] || 0;
                  const itemCostOnly = scannedItems.reduce((sum, item) => {
                    const cost = item.price * item.quantity;
                    if (item.splitMode === 'equal') {
                      const activeCount = Object.values(item.consumers).filter(Boolean).length;
                      if (item.consumers[p.id] && activeCount > 0) return sum + (cost / activeCount);
                    } else if (item.consumers[p.id]) {
                      const customAmt = parseFloat(item.customAmounts[p.id] || '0') || 0;
                      return sum + customAmt;
                    }
                    return sum;
                  }, 0);

                  return (
                    <View key={p.id} style={styles.breakdownRow}>
                      <Text style={styles.breakdownName}>{p.name.split(' ')[0] === user?.name.split(' ')[0] ? 'You' : p.name}</Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.breakdownTotalShare}>₹{share.toFixed(2)}</Text>
                        <Text style={styles.breakdownItemShare}>item: ₹{itemCostOnly.toFixed(2)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.receiptSubmitBtn}
            onPress={() => handleSaveDigitalReceipt(totalBillCalculated, shares)}
            activeOpacity={0.8}
          >
            <Text style={styles.receiptSubmitBtnText}>Save Expense</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const itemSplitPillText = (activeCount: number) => {
    return activeCount === 0 ? styles.itemSplitPillTextUnassigned : styles.itemSplitPillText;
  };

  return (
    <ScreenWrapper hideHeader={false} hideBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {isEditingDigitalReceipt ? (
          renderDigitalReceiptEditor()
        ) : (
          <>
            {/* 1. Fixed Top Card */}
        <View style={styles.topCardContainer}>
          <TabSlider
            tabs={['Personal', 'Group']}
            activeIndex={expenseType === 'personal' ? 0 : 1}
            onChange={(idx) => {
              setExpenseType(idx === 0 ? 'personal' : 'group');
              if (idx === 1 && !selectedGroup && selectedFriends.length === 0) {
                setIsGroupFriendsPickerVisible(true);
              }
            }}
            style={{ width: 200, marginBottom: 20 }}
          />

          {expenseType === 'group' && (
            <TouchableOpacity
              style={styles.groupSelectorRow}
              onPress={() => setIsGroupFriendsPickerVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.groupSelectorLabel}>Split with:</Text>
              <View style={styles.groupSelectorPill}>
                <Text style={styles.groupSelectorText} numberOfLines={1}>
                  {selectedGroup 
                    ? `${selectedGroup.icon || '👥'} ${selectedGroup.name}` 
                    : selectedFriends.length > 0 
                      ? `👥 ${selectedFriends.length} Friends` 
                      : 'Select Group / Friends'}
                </Text>
                <ArrowIcon />
              </View>
            </TouchableOpacity>
          )}

          {/* Amount Display Area */}
          <TouchableOpacity
            style={styles.amountDisplayRow}
            onPress={handleAmountPress}
            activeOpacity={0.9}
          >
            <TouchableOpacity 
              style={styles.currencyBox}
              onPress={() => Alert.alert('Currency Selector', 'Currency change function coming soon!')}
              activeOpacity={0.7}
            >
              <Text style={styles.currencySymbol}>₹</Text>
            </TouchableOpacity>

            <TextInput
              ref={amountInputRef}
              style={[
                styles.amountValueText,
                { fontSize: amount.length <= 5 ? 90 : amount.length <= 8 ? 64 : 44 },
                !amount && styles.amountPlaceholder,
                styles.amountTextInput,
                { width: Math.max(60, inputWidth + 20), maxWidth: 190 }
              ]}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={(val) => {
                const cleanVal = val.replace(/[^0-9.]/g, '');
                const parts = cleanVal.split('.');
                if (parts.length > 2) return;
                setAmount(cleanVal);
              }}
              placeholder="00.00"
              placeholderTextColor="#5A7268"
              selectionColor={COLORS.primary}
            />

            {/* Hidden text to measure layout width of custom font accurately */}
            <Text
              style={[
                styles.amountValueText,
                {
                  fontSize: amount.length <= 5 ? 90 : amount.length <= 8 ? 64 : 44,
                  position: 'absolute',
                  opacity: 0,
                  left: -9999,
                  top: -9999,
                  maxWidth: 190,
                }
              ]}
              onLayout={(e) => {
                setInputWidth(e.nativeEvent.layout.width);
              }}
            >
              {amount || '00.00'}
            </Text>
          </TouchableOpacity>

          {/* Scan & Voice Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.actionPill}
              onPress={handleScanReceipt}
              activeOpacity={0.7}
            >
              <DocumentIcon />
              <Text style={styles.actionPillText}>Scan Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionPill}
              onPress={() => Alert.alert('Voice Entry', 'Voice entry feature coming soon!')}
              activeOpacity={0.7}
            >
              <MicIcon />
              <Text style={styles.actionPillText}>Voice Entry</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Scrollable rest of the fields */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {expenseType === 'group' && (
            <View style={[styles.splitRow, { marginBottom: 24 }]}>
              <Text style={styles.splitLabel}>Paid by </Text>
              <TouchableOpacity
                style={styles.splitPill}
                onPress={() => {
                  if (!amount || parseFloat(amount) <= 0) {
                    Alert.alert('Amount Required', 'Please type in the expense amount first.');
                    return;
                  }
                  setIsPayerModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.splitPillText}>{getPayerLabel()}</Text>
              </TouchableOpacity>
              <Text style={styles.splitLabel}> and split </Text>
              <TouchableOpacity
                style={styles.splitPill}
                onPress={() => {
                  if (!amount || parseFloat(amount) <= 0) {
                    Alert.alert('Amount Required', 'Please type in the expense amount first.');
                    return;
                  }
                  setIsSplitModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.splitPillText}>{getSplitLabel()}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Description Input */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={styles.underlineInput}
              value={description}
              onChangeText={setDescription}
              placeholder="What was it for ?"
              placeholderTextColor="#5A7268"
            />
          </View>

          {/* Two-Column Row (Category & Date/Time) */}
          <View style={styles.columnsRow}>
            <View style={styles.column}>
              <Text style={styles.fieldLabel}>Category</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setIsCategoryPickerVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectorText}>
                  {selectedCategory ? `${selectedCategory.icon} ${selectedCategory.name}` : 'Select'}
                </Text>
                <ArrowIcon />
              </TouchableOpacity>
            </View>

            <View style={styles.column}>
              <Text style={styles.fieldLabel}>Date & Time</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setIsDateTimePickerVisible(true)}
                activeOpacity={0.8}
              >
                <CalendarIcon />
                <Text style={styles.selectorText} numberOfLines={1}>
                  {getFormattedDateTime(date)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Note Input */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Note (optional)</Text>
            <TextInput
              style={styles.noteTextArea}
              value={merchant} 
              onChangeText={setMerchant}
              placeholder="Add some extra details..."
              placeholderTextColor="#5A7268"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Save Action Button */}
          <View style={styles.submitCancelRow}>
            <TouchableOpacity
              style={[styles.primaryActionBtn, isLoading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#060D10" />
              ) : (
                <>
                  <Text style={styles.primaryActionBtnText}>{currentEditExpense ? 'Update Expense' : 'Save Expense'}</Text>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#060D10" strokeWidth={3}>
                    <Path d="M20 6 9 17l-5-5" />
                  </Svg>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
        </>
        )}
      </KeyboardAvoidingView>

      {/* Category Picker Modal */}
      <Modal
        visible={isCategoryPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCategoryPickerVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsCategoryPickerVisible(false)} />
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setIsCategoryPickerVisible(false)}>
                <Text style={styles.pickerModalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.pickerGrid}>
              {categories.map((category) => {
                const isSelected = selectedCategoryId === category.id;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.pickerItem,
                      isSelected && styles.pickerItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedCategoryId(category.id);
                      setIsCategoryPickerVisible(false);
                    }}
                  >
                    <Text style={styles.pickerItemIcon}>{category.icon || '💰'}</Text>
                    <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]} numberOfLines={1}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.pickerAddCustomBtn}
              onPress={() => {
                setIsCategoryPickerVisible(false);
                setIsAddCategoryVisible(true);
              }}
            >
              <Text style={styles.pickerAddCustomBtnText}>➕ Add Custom Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Custom Category Modal */}
      <Modal
        visible={isAddCategoryVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseAddCategory}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Custom Category</Text>
              
              <View style={styles.modalInputContainer}>
                <Text style={styles.emojiLabel}>Category Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Category Name"
                  placeholderTextColor="#5A7268"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                />
              </View>

              <View style={styles.modalInputContainer}>
                <Text style={styles.emojiLabel}>Category Emoji Icon</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 🍿"
                  placeholderTextColor="#5A7268"
                  value={newCategoryIcon}
                  onChangeText={setNewCategoryIcon}
                  maxLength={4}
                />
              </View>

              <Text style={styles.emojiLabel}>Or Select Preset Icon</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.emojiList}
              >
                {EMOJI_OPTIONS.map((emoji) => {
                  const isSelected = newCategoryIcon === emoji;
                  return (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.emojiItem,
                        isSelected && styles.emojiItemSelected,
                      ]}
                      onPress={() => setNewCategoryIcon(emoji)}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalSubmitBtn]}
                  onPress={handleAddCategory}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalSubmitBtnText}>Create</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalCancelBtn]}
                  onPress={handleCloseAddCategory}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Group & Friends Selection Picker Modal */}
      <Modal
        visible={isGroupFriendsPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsGroupFriendsPickerVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsGroupFriendsPickerVisible(false)} />
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Split with Group or Friends</Text>
              <TouchableOpacity onPress={() => setIsGroupFriendsPickerVisible(false)}>
                <Text style={styles.pickerModalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {/* Groups section */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Groups</Text>
                <TouchableOpacity
                  style={styles.smallAddHeaderBtn}
                  onPress={() => {
                    setIsGroupFriendsPickerVisible(false);
                    setIsCreateGroupVisible(true);
                  }}
                >
                  <Text style={styles.smallAddHeaderBtnText}>➕ Create</Text>
                </TouchableOpacity>
              </View>
              {groups.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={[styles.emptyText, { marginBottom: 0 }]}>No groups found.</Text>
                </View>
              ) : (
                <View style={{ marginBottom: 12 }}>
                  {groups.map((group) => {
                    const isSelected = selectedGroup?.id === group.id;
                    return (
                      <GroupListItem
                        key={group.id}
                        group={group}
                        currentUserId={user?.id || ''}
                        selected={isSelected}
                        onPress={() => {
                          setSelectedGroup(group);
                          setSelectedFriends([]);
                        }}
                      />
                    );
                  })}
                </View>
              )}

              {/* Friends section */}
              <View style={[styles.sectionHeaderRow, { marginTop: 12 }]}>
                <Text style={styles.sectionHeader}>Friends</Text>
                <TouchableOpacity
                  style={styles.smallAddHeaderBtn}
                  onPress={() => {
                    setIsGroupFriendsPickerVisible(false);
                    setAddFriendVisible(true);
                  }}
                >
                  <Text style={styles.smallAddHeaderBtnText}>➕ Add</Text>
                </TouchableOpacity>
              </View>
              {friends.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={[styles.emptyText, { marginBottom: 0 }]}>No friends found.</Text>
                </View>
              ) : (
                <View>
                  {friends.map((friend) => {
                    const isSelected = selectedFriends.some((f) => f.id === friend.id);
                    return (
                      <FriendListItem
                        key={friend.id}
                        friend={friend}
                        groups={groups}
                        currentUserId={user?.id || ''}
                        selected={isSelected}
                        onPress={() => {
                          setSelectedGroup(null);
                          if (isSelected) {
                            setSelectedFriends(selectedFriends.filter((f) => f.id !== friend.id));
                          } else {
                            setSelectedFriends([...selectedFriends, friend]);
                          }
                        }}
                      />
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payer Selector Modal */}
      <Modal
        visible={isPayerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleClosePayerModal}
      >
        <View style={styles.pickerModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClosePayerModal} />
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Who Paid?</Text>
              <TouchableOpacity onPress={handleClosePayerModal}>
                <Text style={styles.pickerModalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            {/* Segment Controller */}
            <View style={styles.modalSegmentControl}>
              <TouchableOpacity
                style={[styles.modalSegmentButton, payerMode === 'single' && styles.modalSegmentButtonActive]}
                onPress={() => setPayerMode('single')}
              >
                <Text style={[styles.modalSegmentButtonText, payerMode === 'single' && styles.modalSegmentButtonTextActive]}>
                  Single Payer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSegmentButton, payerMode === 'multiple-equal' && styles.modalSegmentButtonActive]}
                onPress={() => setPayerMode('multiple-equal')}
              >
                <Text style={[styles.modalSegmentButtonText, payerMode === 'multiple-equal' && styles.modalSegmentButtonTextActive]}>
                  Multiple (Equal)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSegmentButton, payerMode === 'multiple-unequal' && styles.modalSegmentButtonActive]}
                onPress={() => setPayerMode('multiple-unequal')}
              >
                <Text style={[styles.modalSegmentButtonText, payerMode === 'multiple-unequal' && styles.modalSegmentButtonTextActive]}>
                  Multiple (Unequal)
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300, marginVertical: 12 }}>
              {payerMode === 'single' && (
                <View style={styles.horizontalGrid}>
                  {participants.map((person) => {
                    const isSelected = singlePayerId === person.id;
                    return (
                      <TouchableOpacity
                        key={person.id}
                        style={[styles.listCard, isSelected && styles.listCardSelected]}
                        onPress={() => {
                          setSinglePayerId(person.id);
                          setIsPayerModalVisible(false);
                        }}
                      >
                        <Text style={styles.listCardIcon}>{person.avatar || '👤'}</Text>
                        <Text style={[styles.listCardText, isSelected && styles.listCardTextSelected]} numberOfLines={1}>
                          {person.id === user?.id ? 'You' : person.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {payerMode === 'multiple-equal' && (
                <View style={styles.checkboxList}>
                  {participants.map((person) => {
                    const isChecked = !!payersEqualChecked[person.id];
                    return (
                      <TouchableOpacity
                        key={person.id}
                        style={styles.checkboxRow}
                        onPress={() => {
                          setPayersEqualChecked({
                            ...payersEqualChecked,
                            [person.id]: !isChecked
                          });
                        }}
                      >
                        <View style={[styles.checkboxBox, isChecked && styles.checkboxBoxChecked]}>
                          {isChecked && <CheckIcon />}
                        </View>
                        <Text style={styles.checkboxLabelText}>
                          {person.id === user?.id ? 'You' : person.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {payerMode === 'multiple-unequal' && (
                <View style={styles.inputsList}>
                  {participants.map((person) => (
                    <View key={person.id} style={styles.inputRow}>
                      <Text style={styles.inputRowLabel}>
                        {person.id === user?.id ? 'You' : person.name}
                      </Text>
                      <TextInput
                        style={styles.rowNumericInput}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor="#5A7268"
                        value={payersUnequalData[person.id] || ''}
                        onChangeText={(val) => {
                          setPayersUnequalData({
                            ...payersUnequalData,
                            [person.id]: val.replace(/[^0-9.]/g, '')
                          });
                        }}
                      />
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Validation Banner for Custom / Unequal */}
            {payerMode === 'multiple-unequal' && (
              <View style={styles.validationRow}>
                <Text style={styles.validationLabel}>Total Paid:</Text>
                <Text style={[
                  styles.validationValue,
                  Math.abs(totalUnequalPayerSum - parseFloat(amount || '0')) < 0.05
                    ? styles.validationSuccess
                    : styles.validationError
                ]}>
                  ₹{totalUnequalPayerSum.toFixed(2)} of ₹{parseFloat(amount || '0').toFixed(2)}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                payerMode === 'multiple-unequal' && Math.abs(totalUnequalPayerSum - parseFloat(amount || '0')) >= 0.05 && { opacity: 0.5 },
                payerMode === 'multiple-equal' && Object.values(payersEqualChecked).filter(Boolean).length === 0 && { opacity: 0.5 }
              ]}
              disabled={
                (payerMode === 'multiple-unequal' && Math.abs(totalUnequalPayerSum - parseFloat(amount || '0')) >= 0.05) ||
                (payerMode === 'multiple-equal' && Object.values(payersEqualChecked).filter(Boolean).length === 0)
              }
              onPress={handleClosePayerModal}
            >
              <Text style={styles.primaryActionBtnText}>Confirm Payer Configuration</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Split Selector Modal */}
      <Modal
        visible={isSplitModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSplitModalVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsSplitModalVisible(false)} />
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>How to Split?</Text>
              <TouchableOpacity onPress={() => setIsSplitModalVisible(false)}>
                <Text style={styles.pickerModalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            {/* Segment Controller */}
            <View style={styles.modalSegmentControl}>
              <TouchableOpacity
                style={[styles.modalSegmentButton, splitMode === 'equal' && styles.modalSegmentButtonActive]}
                onPress={() => setSplitMode('equal')}
              >
                <Text style={[styles.modalSegmentButtonText, splitMode === 'equal' && styles.modalSegmentButtonTextActive]}>
                  Split Equally
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSegmentButton, splitMode === 'unequal' && styles.modalSegmentButtonActive]}
                onPress={() => setSplitMode('unequal')}
              >
                <Text style={[styles.modalSegmentButtonText, splitMode === 'unequal' && styles.modalSegmentButtonTextActive]}>
                  Split Unequally (Custom)
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300, marginVertical: 12 }}>
              {splitMode === 'equal' && (
                <View style={styles.checkboxList}>
                  {participants.map((person) => {
                    const isChecked = !!splitsEqualChecked[person.id];
                    return (
                      <TouchableOpacity
                        key={person.id}
                        style={styles.checkboxRow}
                        onPress={() => {
                          setSplitsEqualChecked({
                            ...splitsEqualChecked,
                            [person.id]: !isChecked
                          });
                        }}
                      >
                        <View style={[styles.checkboxBox, isChecked && styles.checkboxBoxChecked]}>
                          {isChecked && <CheckIcon />}
                        </View>
                        <Text style={styles.checkboxLabelText}>
                          {person.id === user?.id ? 'You' : person.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {splitMode === 'unequal' && (
                <View style={styles.inputsList}>
                  {participants.map((person) => (
                    <View key={person.id} style={styles.inputRow}>
                      <Text style={styles.inputRowLabel}>
                        {person.id === user?.id ? 'You' : person.name}
                      </Text>
                      <TextInput
                        style={styles.rowNumericInput}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor="#5A7268"
                        value={splitsUnequalData[person.id] || ''}
                        onChangeText={(val) => {
                          setSplitsUnequalData({
                            ...splitsUnequalData,
                            [person.id]: val.replace(/[^0-9.]/g, '')
                          });
                        }}
                      />
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Validation Banner for Custom / Unequal */}
            {splitMode === 'unequal' && (
              <View style={styles.validationRow}>
                <Text style={styles.validationLabel}>Total Split:</Text>
                <Text style={[
                  styles.validationValue,
                  Math.abs(totalUnequalSplitSum - parseFloat(amount || '0')) < 0.05
                    ? styles.validationSuccess
                    : styles.validationError
                ]}>
                  ₹{totalUnequalSplitSum.toFixed(2)} of ₹{parseFloat(amount || '0').toFixed(2)}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                splitMode === 'unequal' && Math.abs(totalUnequalSplitSum - parseFloat(amount || '0')) >= 0.05 && { opacity: 0.5 },
                splitMode === 'equal' && Object.values(splitsEqualChecked).filter(Boolean).length === 0 && { opacity: 0.5 }
              ]}
              disabled={
                (splitMode === 'unequal' && Math.abs(totalUnequalSplitSum - parseFloat(amount || '0')) >= 0.05) ||
                (splitMode === 'equal' && Object.values(splitsEqualChecked).filter(Boolean).length === 0)
              }
              onPress={() => setIsSplitModalVisible(false)}
            >
              <Text style={styles.primaryActionBtnText}>Confirm Split Configuration</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Group Modal */}
      <CreateGroupModal
        visible={isCreateGroupVisible}
        onClose={() => setIsCreateGroupVisible(false)}
        friends={friends}
        onCreateGroup={handleCreateGroupSubmit}
        onAddFriendClick={() => {
          setIsCreateGroupVisible(false);
          setAddFriendVisible(true);
        }}
      />

      {/* DateTime Picker Modal */}
      <DateTimePickerModal
        visible={isDateTimePickerVisible}
        onClose={() => setIsDateTimePickerVisible(false)}
        value={isEditingDigitalReceipt ? scannedDate : date}
        onConfirm={(selectedDateIso) => {
          if (isEditingDigitalReceipt) {
            setScannedDate(selectedDateIso);
          } else {
            setDate(selectedDateIso);
          }
          setIsDateTimePickerVisible(false);
        }}
      />

      {/* Item Split Selector Modal */}
      <Modal
        visible={isItemSplitModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsItemSplitModalVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsItemSplitModalVisible(false)} />
          <View style={[styles.pickerModalContent, { maxHeight: '90%' }]}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle} numberOfLines={1}>
                Split Item: {editingItemIndex !== null ? scannedItems[editingItemIndex]?.name || 'Item' : ''}
              </Text>
              <TouchableOpacity onPress={() => setIsItemSplitModalVisible(false)}>
                <Text style={styles.pickerModalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {editingItemIndex !== null && (() => {
              const currentItem = scannedItems[editingItemIndex];
              const itemCost = currentItem.price * currentItem.quantity;
              
              const customSum = participants.reduce((sum, p) => {
                if (itemConsumersChecked[p.id]) {
                  const val = parseFloat(itemConsumersUnequalData[p.id] || '0') || 0;
                  return sum + val;
                }
                return sum;
              }, 0);

              const validationColor = Math.abs(customSum - itemCost) < 0.05 ? COLORS.success : COLORS.error;

              return (
                <ScrollView contentContainerStyle={{ gap: 16 }} keyboardShouldPersistTaps="handled">
                  <Text style={styles.itemSplitTotalLabel}>Item Total: ₹{itemCost.toFixed(2)}</Text>

                  <TabSlider
                    tabs={['Equally', 'Custom Amount']}
                    activeIndex={itemSplitMode === 'equal' ? 0 : 1}
                    onChange={(idx) => {
                      setItemSplitMode(idx === 0 ? 'equal' : 'unequal');
                    }}
                    style={{ width: '100%', marginBottom: 8 }}
                  />

                  <Text style={styles.sectionHeader}>Consumers</Text>
                  <View style={{ gap: 10 }}>
                    {participants.map((p) => {
                      const isChecked = !!itemConsumersChecked[p.id];
                      const userAmountStr = itemConsumersUnequalData[p.id] || '';
                      
                      const activeCheckedCount = Object.values(itemConsumersChecked).filter(Boolean).length;
                      const equalShareText = isChecked && activeCheckedCount > 0 
                        ? `₹${(itemCost / activeCheckedCount).toFixed(2)}` 
                        : '₹0.00';

                      if (itemSplitMode === 'equal') {
                        return (
                          <TouchableOpacity
                            key={p.id}
                            style={styles.checkboxRow}
                            onPress={() => {
                              const updatedChecked = { ...itemConsumersChecked, [p.id]: !isChecked };
                              setItemConsumersChecked(updatedChecked);
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.checkboxBox, isChecked && styles.checkboxBoxChecked]}>
                              {isChecked && <CheckIcon />}
                            </View>
                            <Text style={styles.checkboxLabelText}>
                              {p.name.split(' ')[0] === user?.name.split(' ')[0] ? 'You' : p.name}
                            </Text>
                            {isChecked && (
                              <Text style={[styles.payerEqualShareText, { marginLeft: 'auto' }]}>
                                {equalShareText}
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      } else {
                        return (
                          <View key={p.id} style={styles.inputRow}>
                            <TouchableOpacity
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}
                              onPress={() => {
                                const updatedChecked = { ...itemConsumersChecked, [p.id]: !isChecked };
                                setItemConsumersChecked(updatedChecked);
                                if (isChecked) {
                                  const updatedAmounts = { ...itemConsumersUnequalData };
                                  delete updatedAmounts[p.id];
                                  setItemConsumersUnequalData(updatedAmounts);
                                }
                              }}
                              activeOpacity={0.7}
                            >
                              <View style={[styles.checkboxBox, isChecked && styles.checkboxBoxChecked]}>
                                {isChecked && <CheckIcon />}
                              </View>
                              <Text style={styles.checkboxLabelText}>
                                {p.name.split(' ')[0] === user?.name.split(' ')[0] ? 'You' : p.name}
                              </Text>
                            </TouchableOpacity>

                            {isChecked && (
                              <TextInput
                                style={styles.rowNumericInput}
                                value={userAmountStr}
                                keyboardType="decimal-pad"
                                placeholder="0.00"
                                placeholderTextColor="#5A7268"
                                onChangeText={(text) => {
                                  const cleanText = text.replace(/[^0-9.]/g, '');
                                  setItemConsumersUnequalData({
                                    ...itemConsumersUnequalData,
                                    [p.id]: cleanText,
                                  });
                                }}
                              />
                            )}
                          </View>
                        );
                      }
                    })}
                  </View>

                  {itemSplitMode === 'unequal' && (
                    <View style={styles.receiptValidationBox}>
                      <Text style={[styles.receiptValidationText, { color: validationColor }]}>
                        Total assigned: ₹{customSum.toFixed(2)} of ₹{itemCost.toFixed(2)}
                      </Text>
                      {Math.abs(customSum - itemCost) >= 0.05 && (
                        <Text style={styles.receiptValidationSubtext}>
                          Difference: ₹{(itemCost - customSum).toFixed(2)} remaining.
                        </Text>
                      )}
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.primaryActionBtn,
                      itemSplitMode === 'unequal' && Math.abs(customSum - itemCost) >= 0.05 && { opacity: 0.5 }
                    ]}
                    disabled={itemSplitMode === 'unequal' && Math.abs(customSum - itemCost) >= 0.05}
                    onPress={() => {
                      if (itemSplitMode === 'unequal' && Math.abs(customSum - itemCost) >= 0.05) {
                        Alert.alert('Incorrect Split Sum', `Please ensure total split sum equals ₹${itemCost.toFixed(2)}`);
                        return;
                      }
                      
                      const updated = [...scannedItems];
                      updated[editingItemIndex] = {
                        ...currentItem,
                        splitMode: itemSplitMode,
                        consumers: itemConsumersChecked,
                        customAmounts: itemConsumersUnequalData,
                      };
                      setScannedItems(updated);
                      setIsItemSplitModalVisible(false);
                    }}
                  >
                    <Text style={styles.primaryActionBtnText}>Apply Split</Text>
                  </TouchableOpacity>
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Scanning AI Progress Overlay */}
      {isScanning && (
        <Modal transparent animationType="fade">
          <View style={styles.scanningOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.scanningText}>AI is parsing your receipt...</Text>
            <Text style={styles.scanningSubtext}>Extracting items, prices, and taxes</Text>
          </View>
        </Modal>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  hiddenInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
  topCardContainer: {
    backgroundColor: '#071013',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 36,
    padding: 20,
    marginHorizontal: 24,
    marginTop: 0,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
  amountDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 20,
    gap: 12,
  },
  currencyBox: {
    width: 88,
    height: 88,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 13, 16, 0.4)',
    borderWidth: 1,
    borderColor: '#0D242E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencySymbol: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 90,
    color: '#B1CDC1',
  },
  amountValueText: {
    fontFamily: 'BebasNeue-Regular',
    color: '#DBE8E3',
  },
  amountPlaceholder: {
    color: '#5A7268',
  },
  amountTextInput: {
    textAlign: 'left',
    padding: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    margin: 0,
    borderWidth: 0,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  splitLabel: {
    color: '#5A7268',
    fontSize: 16,
    fontWeight: '600',
  },
  splitPill: {
    backgroundColor: 'rgba(6, 13, 16, 0.2)',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  splitPillText: {
    color: '#DBE8E3',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(6, 13, 16, 0.4)',
    borderWidth: 1,
    borderColor: '#0D242E',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionPillText: {
    color: '#B1CDC1',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 40,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: "800",
    color: '#7E9A8E',
    marginBottom: 8,
  },
  underlineInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#0D242E',
    color: '#DBE8E3',
    fontSize: 18,
    paddingVertical: 8,
    fontFamily: 'System',
  },
  columnsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  column: {
    flex: 1,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#071317',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    gap: 8,
  },
  selectorText: {
    color: '#DBE8E3',
    fontSize: 15,
    fontWeight: '500',
  },
  noteTextArea: {
    backgroundColor: '#071317',
    borderRadius: 16,
    padding: 16,
    color: '#DBE8E3',
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  submitCancelRow: {
    marginTop: 10,
    marginBottom: 20,
  },
  primaryActionBtn: {
    backgroundColor: '#B1CDC1',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  primaryActionBtnText: {
    color: '#060D10',
    fontSize: 18,
    fontWeight: '700',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 9, 0.65)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#071317',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: '#0D242E',
    padding: 24,
    maxHeight: '80%',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pickerModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DBE8E3',
  },
  pickerModalCloseText: {
    fontSize: 16,
    color: '#00EE87',
    fontWeight: '600',
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  pickerItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: 'rgba(6, 13, 16, 0.4)',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  pickerItemSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pickerItemIcon: {
    fontSize: 60,
    marginBottom: 6,
  },
  pickerItemText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  pickerItemTextSelected: {
    color: '#060D10',
    fontWeight: '600',
  },
  pickerAddCustomBtn: {
    borderWidth: 1,
    borderColor: '#5A7268',
    borderStyle: 'dashed',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  pickerAddCustomBtnText: {
    color: '#B1CDC1',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 9, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#071317',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 32,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DBE8E3',
    marginBottom: 20,
  },
  modalInputContainer: {
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(6, 13, 16, 0.6)',
    borderWidth: 1,
    borderColor: '#0D242E',
    paddingHorizontal: 16,
    color: '#DBE8E3',
    fontSize: 15,
  },
  emojiLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emojiList: {
    paddingVertical: 4,
    gap: 8,
    marginBottom: 24,
  },
  emojiItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  emojiItemSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  emojiText: {
    fontSize: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitBtn: {
    backgroundColor: COLORS.primary,
  },
  modalSubmitBtnText: {
    color: '#060D10',
    fontWeight: '600',
    fontSize: 15,
  },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  modalCancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontSize: 15,
  },

  // Group selector styling
  groupSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(6, 13, 16, 0.4)',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 20,
    width: '100%',
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
  },
  groupSelectorLabel: {
    color: '#5A7268',
    fontSize: 14,
    fontWeight: '600',
  },
  groupSelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupSelectorText: {
    color: '#DBE8E3',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 160,
  },

  // List & Section styling in Picker
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A7268',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  smallAddHeaderBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(177, 205, 193, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(177, 205, 193, 0.15)',
  },
  smallAddHeaderBtnText: {
    color: '#B1CDC1',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: 'rgba(6, 13, 16, 0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  emptyText: {
    color: '#5A7268',
    fontSize: 14,
    marginBottom: 8,
  },
  inlineAddBtn: {
    backgroundColor: '#0D242E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inlineAddBtnText: {
    color: '#B1CDC1',
    fontWeight: '600',
    fontSize: 12,
  },
  horizontalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  listCard: {
    width: '31%',
    backgroundColor: 'rgba(6, 13, 16, 0.4)',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 16,
    alignItems: 'center',
    padding: 12,
  },
  listCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  listCardIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  listCardText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  listCardTextSelected: {
    color: '#060D10',
  },

  // Segment Selector styling
  modalSegmentControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(6, 13, 16, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0D242E',
    padding: 4,
    marginBottom: 16,
  },
  modalSegmentButton: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSegmentButtonActive: {
    backgroundColor: '#0D242E',
  },
  modalSegmentButtonText: {
    color: '#5A7268',
    fontSize: 12,
    fontWeight: '600',
  },
  modalSegmentButtonTextActive: {
    color: '#00EE87',
  },

  // Checkbox list styling
  checkboxList: {
    gap: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 13, 16, 0.4)',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    gap: 12,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#5A7268',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#00EE87',
    borderColor: '#00EE87',
  },
  checkboxLabelText: {
    color: '#DBE8E3',
    fontSize: 16,
    fontWeight: '600',
  },

  // Custom Split/Payer input list styling
  inputsList: {
    gap: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(6, 13, 16, 0.4)',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
  },
  inputRowLabel: {
    color: '#DBE8E3',
    fontSize: 15,
    fontWeight: '600',
  },
  rowNumericInput: {
    width: 120,
    height: 40,
    backgroundColor: 'rgba(6, 13, 16, 0.6)',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#DBE8E3',
    fontSize: 16,
    textAlign: 'right',
    fontWeight: '700',
  },

  // Validation styling
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#0D242E',
    paddingTop: 16,
    marginBottom: 16,
  },
  validationLabel: {
    color: '#5A7268',
    fontSize: 14,
    fontWeight: '600',
  },
  validationValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  validationSuccess: {
    color: '#00EE87',
  },
  validationError: {
    color: '#FF3B30',
  },

  // Receipts & Scanner Styles
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  receiptBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  receiptBackBtnText: {
    color: '#B1CDC1',
    fontSize: 14,
    fontWeight: '600',
  },
  receiptHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#DBE8E3',
    textAlign: 'center',
    marginRight: 80,
  },
  paperReceiptCard: {
    backgroundColor: 'rgba(14, 23, 27, 0.65)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 32,
    padding: 24,
    marginHorizontal: 4,
    marginBottom: 20,
    boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.4)',
  },
  receiptSection: {
    gap: 12,
    marginBottom: 16,
  },
  receiptMerchantInput: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay-Italic',
    color: '#DBE8E3',
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(177, 205, 193, 0.15)',
  },
  receiptDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  receiptDateText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  receiptDashedLine: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(177, 205, 193, 0.15)',
    borderRadius: 1,
    marginVertical: 16,
  },
  receiptItemsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5A7268',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  receiptAddIconBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 238, 135, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 238, 135, 0.15)',
  },
  receiptAddIconBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  receiptEmptyItemsText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
  receiptItemRowContainer: {
    gap: 6,
    marginBottom: 12,
    backgroundColor: 'rgba(6, 13, 16, 0.3)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(28, 41, 46, 0.3)',
  },
  receiptItemMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  receiptItemInput: {
    fontSize: 15,
    color: '#DBE8E3',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(17, 30, 36, 0.5)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(28, 41, 46, 0.5)',
  },
  receiptItemDeleteBtn: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptItemDeleteBtnText: {
    fontSize: 24,
    color: COLORS.error,
    fontWeight: '300',
  },
  itemSplitPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(90, 200, 250, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(90, 200, 250, 0.15)',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  itemSplitPillText: {
    fontSize: 11,
    color: '#5AC8FA',
    fontWeight: '600',
  },
  itemSplitPillTextUnassigned: {
    fontSize: 11,
    color: COLORS.error,
    fontWeight: '600',
  },
  receiptSummaryBlock: {
    gap: 12,
  },
  receiptSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptSummaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  receiptSummaryValue: {
    color: '#DBE8E3',
    fontSize: 14,
    fontWeight: '600',
  },
  receiptTaxesInput: {
    fontSize: 14,
    color: '#DBE8E3',
    textAlign: 'right',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(17, 30, 36, 0.5)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(28, 41, 46, 0.5)',
    width: 100,
  },
  receiptSummaryTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  receiptSummaryTotalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  receiptSliderWrapper: {
    alignItems: 'center',
    marginVertical: 16,
  },
  receiptGroupContainer: {
    gap: 16,
    marginBottom: 24,
  },
  breakdownHeaderTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  breakdownCard: {
    backgroundColor: '#0E171B',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownName: {
    color: '#DBE8E3',
    fontSize: 14,
    fontWeight: '600',
  },
  breakdownTotalShare: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  breakdownItemShare: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'right',
  },
  receiptSubmitBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  receiptSubmitBtnText: {
    color: '#060D10',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemSplitTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DBE8E3',
    textAlign: 'center',
    marginBottom: 8,
  },
  payerEqualShareText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  receiptValidationBox: {
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.15)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  receiptValidationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  receiptValidationSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  scanningOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 9, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  scanningText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DBE8E3',
  },
  scanningSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
