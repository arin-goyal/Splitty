import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Pressable,
  Modal
} from 'react-native';
import Button from '../Button';
import { BlurView } from 'expo-blur';
import { useAppStore } from '../../store/appStore';
import { PencilIcon, TrashIcon } from './icons';

export default function ManageBudgetsModal() {
  const {
    budgets,
    categories,
    fetchBudgets,
    fetchCategories,
    createBudget,
    deleteBudget,
    isManageBudgetVisible,
    budgetModalMode,
    setIsManageBudgetVisible
  } = useAppStore();

  const [modalMode, setModalMode] = useState<'list' | 'add' | 'edit'>(budgetModalMode);
  const [editingBudget, setEditingBudget] = useState<any>(null);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('💰');
  const [limitInput, setLimitInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setModalMode(budgetModalMode);
  }, [budgetModalMode, isManageBudgetVisible]);

  const resetForm = () => {
    setSelectedCategory('');
    setIsNewCategory(false);
    setNewCategoryName('');
    setNewCategoryIcon('💰');
    setLimitInput('');
  };

  const handleClose = () => {
    resetForm();
    setEditingBudget(null);
    setIsManageBudgetVisible(false);
  };

  const handleSaveBudget = async () => {
    const categoryName = modalMode === 'edit' ? editingBudget?.category : (isNewCategory ? newCategoryName.trim() : selectedCategory);
    const limitNum = parseFloat(limitInput);

    if (!categoryName) {
      Alert.alert('Required field', 'Please select or enter a category name.');
      return;
    }
    if (isNaN(limitNum) || limitNum <= 0) {
      Alert.alert('Invalid limit', 'Please enter a valid monthly limit.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await createBudget({
        category: categoryName,
        monthlyLimit: limitNum,
        icon: (modalMode === 'add' && isNewCategory) ? newCategoryIcon.trim() : undefined,
      });

      if (success) {
        setModalMode('list');
        setEditingBudget(null);
        resetForm();
      } else {
        Alert.alert('Error', 'Failed to save budget.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while saving the budget.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudget = (id: string) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteBudget(id);
              if (!success) {
                Alert.alert('Error', 'Failed to delete budget.');
              }
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'An error occurred while deleting the budget.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={isManageBudgetVisible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFill}
            experimentalBlurMethod="dimezisBlurView"
          />
        </Pressable>
        
        <View style={[styles.modalCard, modalMode === 'list' ? styles.modalCardLarge : null]}>
          {modalMode === 'list' ? (
            <>
              <Text style={styles.modalTitle}>Manage Budgets</Text>
              <Text style={styles.modalSubtitle}>Current active budgets</Text>

              {budgets.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Text style={[styles.budgetEmptyText, { marginBottom: 0 }]}>No budgets set</Text>
                </View>
              ) : (
                <ScrollView
                  style={{ maxHeight: 240, marginBottom: 8, flexGrow: 0 }}
                  contentContainerStyle={{ flexGrow: 1 }}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  {budgets.map((b) => (
                    <View key={b.id} style={styles.manageBudgetItem}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                        <Text style={{ fontSize: 20, marginRight: 8 }}>{b.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.manageBudgetLabel} numberOfLines={1}>
                            {b.category}
                          </Text>
                          <Text style={styles.manageBudgetLimit}>
                            Limit: ₹{b.limit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingBudget(b);
                            setLimitInput(b.limit.toString());
                            setModalMode('edit');
                          }}
                          activeOpacity={0.7}
                          style={styles.actionIconButton}
                        >
                          <PencilIcon />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteBudget(b.id)}
                          activeOpacity={0.7}
                          style={styles.actionIconButton}
                        >
                          <TrashIcon />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}

              <View style={[styles.modalActions, { marginTop: 12 }]}>
                <Button
                  variant="outline"
                  title="Close"
                  style={styles.modalBtn}
                  onPress={handleClose}
                />

                <Button
                  variant="filled"
                  color="#B1CDC1"
                  title="+ Add New"
                  style={styles.modalBtn}
                  onPress={() => {
                    resetForm();
                    setModalMode('add');
                  }}
                />
              </View>
            </>
          ) : modalMode === 'edit' ? (
            <>
              <TouchableOpacity
                onPress={() => {
                  setModalMode('list');
                  setEditingBudget(null);
                  setLimitInput('');
                }}
                style={{ alignSelf: 'flex-start', marginBottom: 12 }}
              >
                <Text style={{ color: '#00EE87', fontSize: 15, fontWeight: '600' }}>← Back to list</Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Edit Budget</Text>
              <Text style={styles.modalSubtitle}>Change monthly limit for category</Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: 'rgba(6, 13, 16, 0.4)', padding: 12, borderRadius: 12 }}>
                <Text style={{ fontSize: 24, marginRight: 12 }}>{editingBudget?.icon}</Text>
                <Text style={{ fontSize: 18, color: '#DBE8E3', fontWeight: '600' }}>{editingBudget?.category}</Text>
              </View>

              <Text style={styles.inputLabel}>Monthly Limit (₹)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 10000"
                placeholderTextColor="#7E9A8E"
                value={limitInput}
                onChangeText={setLimitInput}
                keyboardType="numeric"
                autoFocus
              />

              <View style={styles.modalActions}>
                <Button
                  variant="outline"
                  title="Cancel"
                  style={styles.modalBtn}
                  onPress={() => {
                    setModalMode('list');
                    setEditingBudget(null);
                    setLimitInput('');
                  }}
                />

                <Button
                  variant="filled"
                  color='#B1CDC1'
                  title="Save Changes"
                  style={styles.modalBtn}
                  onPress={handleSaveBudget}
                  loading={isSubmitting}
                />
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => {
                  setModalMode('list');
                  resetForm();
                }}
                style={{ alignSelf: 'flex-start', marginBottom: 12 }}
              >
                <Text style={{ color: '#00EE87', fontSize: 15, fontWeight: '600' }}>← Back to list</Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Add Budget</Text>
              <Text style={styles.modalSubtitle}>Set a monthly budget limit for a category</Text>

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryPickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.name;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryPill,
                          isSelected && styles.categoryPillActive
                        ]}
                        onPress={() => {
                          setSelectedCategory(cat.name);
                          setIsNewCategory(false);
                        }}
                      >
                        <Text style={[
                          styles.categoryPillText,
                          isSelected && styles.categoryPillTextActive
                        ]}>
                          {cat.icon} {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={[
                      styles.categoryPill,
                      isNewCategory && styles.categoryPillActive
                    ]}
                    onPress={() => {
                      setSelectedCategory('');
                      setIsNewCategory(true);
                    }}
                  >
                    <Text style={[
                      styles.categoryPillText,
                      isNewCategory && styles.categoryPillTextActive
                    ]}>
                      ➕ Add New Category
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              {isNewCategory && (
                <>
                  <Text style={styles.inputLabel}>New Category Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Entertainment"
                    placeholderTextColor="#7E9A8E"
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    autoCapitalize="words"
                  />

                  <Text style={styles.inputLabel}>Category Emoji Icon</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 🍿"
                    placeholderTextColor="#7E9A8E"
                    value={newCategoryIcon}
                    onChangeText={setNewCategoryIcon}
                    maxLength={4}
                  />
                </>
              )}

              <Text style={styles.inputLabel}>Monthly Limit (₹)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 10000"
                placeholderTextColor="#7E9A8E"
                value={limitInput}
                onChangeText={setLimitInput}
                keyboardType="numeric"
              />

              <View style={styles.modalActions}>
                <Button
                  variant="outline"
                  title="Cancel"
                  style={styles.modalBtn}
                  onPress={() => {
                    setModalMode('list');
                    resetForm();
                  }}
                />

                <Button
                  variant="filled"
                  color="#B1CDC1"
                  title="Save Budget"
                  style={styles.modalBtn}
                  onPress={handleSaveBudget}
                  loading={isSubmitting}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 10000,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(7, 18, 23, 0.95)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#132531',
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DBE8E3',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#7E9A8E',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B1CDC1',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(6, 13, 16, 0.6)',
    borderWidth: 1,
    borderColor: '#1A3040',
    paddingHorizontal: 16,
    color: '#DBE8E3',
    fontSize: 15,
  },
  categoryPickerContainer: {
    width: '100%',
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1A3040',
    backgroundColor: 'rgba(6, 13, 16, 0.3)',
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#00EE87',
    borderColor: '#00EE87',
  },
  categoryPillText: {
    fontSize: 14,
    color: '#7E9A8E',
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#060D10',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalBtn: {
    flex: 1,
  },
  modalCardLarge: {
    maxWidth: 380,
  },
  manageBudgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: '#132531',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  manageBudgetLabel: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    color: '#DBE8E3',
  },
  manageBudgetLimit: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#7E9A8E',
    marginTop: 2,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetEmptyText: {
    fontFamily: 'System',
    fontSize: 16,
    color: '#5A7268',
    marginBottom: 16,
  },
});
