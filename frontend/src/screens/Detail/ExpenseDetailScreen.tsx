import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'ExpenseDetail'>;

export default function ExpenseDetailScreen({ route, navigation }: Props) {
  const { expenseId } = route.params;

  const { user } = useAuthStore();
  const { expenses, updateExpense, deleteExpense, categories, fetchCategories } = useAppStore();

  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const expense = expenses.find((e) => e.id === expenseId);

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, []);

  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString());
      setCategoryId(expense.categoryId);
      setDescription(expense.description || '');
      setMerchant(expense.merchant || '');
      setTagsStr(expense.tags ? expense.tags.join(', ') : '');
    }
  }, [expense]);

  if (!expense) {
    return (
      <View style={styles.errorContainerCenter}>
        <Text style={styles.errorTextCenter}>Expense not found or deleted.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatCurrency = (amt: number) => {
    const currency = user?.defaultCurrency || 'INR';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(amt);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleUpdate = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setLocalError('Please enter a valid amount.');
      return;
    }

    setLocalLoading(true);
    setLocalError(null);

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      const updated = await updateExpense(expenseId, {
        amount: numAmount,
        categoryId,
        description: description.trim() || undefined,
        merchant: merchant.trim() || undefined,
        tags,
      });

      if (updated) {
        setIsEditing(false);
      } else {
        setLocalError('Failed to update expense.');
      }
    } catch (err: any) {
      setLocalError(err.response?.data?.error || 'An error occurred.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleDelete = async () => {
    setLocalLoading(true);
    try {
      const success = await deleteExpense(expenseId);
      if (success) {
        navigation.goBack();
      } else {
        setLocalError('Failed to delete expense.');
        setLocalLoading(false);
      }
    } catch (err) {
      setLocalError('An error occurred during deletion.');
      setLocalLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        {localError && (
          <View style={styles.errorAlert}>
            <Text style={styles.errorAlertText}>⚠️ {localError}</Text>
          </View>
        )}

        {isEditing ? (
          <View style={styles.form}>
            <Text style={styles.editTitle}>Edit Expense Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Merchant</Text>
              <TextInput
                style={styles.input}
                value={merchant}
                onChangeText={setMerchant}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.pickerContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      categoryId === cat.id && styles.categoryChipSelected,
                    ]}
                    onPress={() => setCategoryId(cat.id)}
                  >
                    <Text style={styles.categoryEmoji}>{cat.icon || '💰'}</Text>
                    <Text
                      style={[
                        styles.categoryName,
                        categoryId === cat.id && styles.categoryNameSelected,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tags (comma separated)</Text>
              <TextInput
                style={styles.input}
                value={tagsStr}
                onChangeText={setTagsStr}
              />
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn]}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.saveBtn]}
                onPress={handleUpdate}
                disabled={localLoading}
              >
                {localLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.detailsView}>
            {/* Amount display */}
            <View style={styles.amountDisplayContainer}>
              <Text style={styles.categoryIconLarge}>
                {expense.category?.icon || '💰'}
              </Text>
              <Text style={styles.amountValue}>
                {formatCurrency(expense.amount)}
              </Text>
              <Text style={styles.merchantName}>
                {expense.merchant || 'Unknown Merchant'}
              </Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValueText}>
                {expense.category?.name || 'Uncategorized'}
              </Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValueText}>
                {expense.description || 'No description provided.'}
              </Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Date & Time</Text>
              <Text style={styles.infoValueText}>{formatDate(expense.date)}</Text>
            </View>

            {expense.tags && expense.tags.length > 0 && (
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>Tags</Text>
                <View style={styles.tagsContainer}>
                  {expense.tags.map((tag) => (
                    <View key={tag} style={styles.tagBadge}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.editBtnText}>Edit Expense</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
                disabled={localLoading}
              >
                {localLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteBtnText}>Delete Expense</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  errorContainerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorTextCenter: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorAlert: {
    backgroundColor: '#FFEBEA',
    borderColor: '#FF3B30',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  errorAlertText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  // Details view styling
  detailsView: {
    width: '100%',
  },
  amountDisplayContainer: {
    alignItems: 'center',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 24,
  },
  categoryIconLarge: {
    fontSize: 48,
    marginBottom: 12,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  merchantName: {
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: '600',
  },
  infoBlock: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  infoValueText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tagBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  actionsContainer: {
    marginTop: 20,
    gap: 12,
  },
  editBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: '#FFEBEA',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  // Form editing view styling
  form: {
    width: '100%',
  },
  editTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    height: 85,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  categoryChipSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderColor: '#007AFF',
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryName: {
    fontSize: 13,
    color: '#000000',
  },
  categoryNameSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginRight: 6,
  },
  cancelBtnText: {
    color: '#8E8E93',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#007AFF',
    marginLeft: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
