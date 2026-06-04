import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppStore } from '../../store/appStore';

type Props = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

export default function AddExpenseScreen({ route, navigation }: Props) {
  const { groupId } = route.params || {};
  const isGroupExpense = !!groupId;

  const { categories, fetchCategories, createExpense, createGroupExpense, activeGroup, fetchGroupDetails } = useAppStore();

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
    if (isGroupExpense && (!activeGroup || activeGroup.id !== groupId)) {
      fetchGroupDetails(groupId);
    }
  }, [groupId]);

  // Set default category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories]);

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setLocalError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!categoryId) {
      setLocalError('Please select a category.');
      return;
    }

    setLocalLoading(true);
    setLocalError(null);

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      if (isGroupExpense) {
        // Group Expense
        const expense = await createGroupExpense({
          groupId,
          amount: numAmount,
          categoryId,
          description: description.trim() || undefined,
          merchant: merchant.trim() || undefined,
          splitType: 'equal',
        });
        if (expense) {
          navigation.goBack();
        } else {
          setLocalError('Failed to create group expense.');
        }
      } else {
        // Personal Expense
        const expense = await createExpense({
          amount: numAmount,
          categoryId,
          description: description.trim() || undefined,
          merchant: merchant.trim() || undefined,
          tags,
        });
        if (expense) {
          navigation.goBack();
        } else {
          setLocalError('Failed to create personal expense.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setLocalError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <Text style={styles.expenseTypeLabel}>
          {isGroupExpense ? `SPLITTING WITH ${activeGroup?.name?.toUpperCase() || 'GROUP'}` : 'PERSONAL EXPENSE'}
        </Text>

        {localError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {localError}</Text>
          </View>
        )}

        {/* Amount input - large and stylized */}
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            style={styles.amountInput}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#8E8E93"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Merchant / Payee</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Starbucks, Uber, Landlord"
              placeholderTextColor="#8E8E93"
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
              placeholder="Add details, notes, or items..."
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {!isGroupExpense && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tags (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. travel, monthly, food"
                placeholderTextColor="#8E8E93"
                value={tagsStr}
                onChangeText={setTagsStr}
              />
            </View>
          )}

          {isGroupExpense && (
            <View style={styles.infoAlert}>
              <Text style={styles.infoAlertText}>
                💡 This expense will be split **equally** among all {activeGroup?.members?.length || 0} members of the group.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={localLoading}
          >
            {localLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Save Expense</Text>
            )}
          </TouchableOpacity>
        </View>
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
  expenseTypeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 16,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 8,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000000',
    marginRight: 6,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'left',
    minWidth: 150,
    padding: 0,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
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
    height: 80,
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
  infoAlert: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  infoAlertText: {
    color: '#007AFF',
    fontSize: 13,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFEBEA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
});
