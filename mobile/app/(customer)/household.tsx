import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useHousehold } from '../../src/context/HouseholdContext';
import { useCart } from '../../src/context/CartContext';
import { useRouter } from 'expo-router';
import { Plus, Check, Trash2, Sparkles, ShoppingBag, ListTodo } from 'lucide-react-native';

export default function HouseholdScreen() {
  const { items, addItem, toggleItem, removeItem, clearCompleted, convertRecipeToList } = useHousehold();
  const { addItem: addCartItem } = useCart();
  const router = useRouter();

  const [newTitle, setNewTitle] = useState('');
  const [newQty, setNewQty] = useState('');
  const [recipeQuery, setRecipeQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleManualAdd = async () => {
    if (!newTitle.trim()) return;
    await addItem(newTitle.trim(), newQty.trim() || '1 unit');
    setNewTitle('');
    setNewQty('');
  };

  const handleAiRecipe = async (prompt?: string) => {
    const query = prompt || recipeQuery;
    if (!query.trim()) return;

    setIsAiLoading(true);
    try {
      await convertRecipeToList(query.trim());
      setRecipeQuery('');
    } finally {
      setIsAiLoading(false);
    }
  };

  const completedCount = items.filter((i) => i.isCompleted).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Household OS</Text>
            <Text style={styles.headerSub}>Shared Family Lists & AI Shopping Assistant</Text>
          </View>
          {completedCount > 0 && (
            <TouchableOpacity onPress={clearCompleted} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear Done</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* AI Recipe Assistant Box */}
        <View style={styles.aiBox}>
          <View style={styles.aiHeader}>
            <Sparkles size={16} color="#059669" />
            <Text style={styles.aiTitle}>Recipe-to-List AI Assistant</Text>
          </View>
          <Text style={styles.aiDesc}>
            Type any dish to automatically generate ingredients from local Indore stores.
          </Text>

          <View style={styles.aiInputRow}>
            <TextInput
              style={styles.aiInput}
              placeholder="e.g. Indori Poha for 4, Masala Chai..."
              placeholderTextColor="#94a3b8"
              value={recipeQuery}
              onChangeText={setRecipeQuery}
            />
            <TouchableOpacity
              onPress={() => handleAiRecipe()}
              disabled={isAiLoading || !recipeQuery.trim()}
              style={[styles.aiBtn, (!recipeQuery.trim() || isAiLoading) && styles.aiBtnDisabled]}
            >
              {isAiLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.aiBtnText}>Generate</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Recipe Chips */}
          <View style={styles.quickChips}>
            <TouchableOpacity onPress={() => handleAiRecipe('Indori Poha')} style={styles.chip}>
              <Text style={styles.chipText}>+ Indori Poha</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleAiRecipe('Masala Chai')} style={styles.chip}>
              <Text style={styles.chipText}>+ Masala Chai</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Manual Add Input */}
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, { flex: 2 }]}
            placeholder="Add household item (e.g. Milk, Atta)"
            placeholderTextColor="#94a3b8"
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Qty (e.g. 1kg)"
            placeholderTextColor="#94a3b8"
            value={newQty}
            onChangeText={setNewQty}
          />
          <TouchableOpacity onPress={handleManualAdd} style={styles.addIconBtn}>
            <Plus size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              {items.length} items on your list ({completedCount} purchased)
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.itemCard, item.isCompleted && styles.itemCardCompleted]}>
            <TouchableOpacity
              onPress={() => toggleItem(item.id)}
              style={[styles.checkbox, item.isCompleted && styles.checkboxActive]}
            >
              {item.isCompleted && <Check size={14} color="#ffffff" />}
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, item.isCompleted && styles.itemTitleCompleted]}>
                {item.title}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.itemQty}>{item.quantity}</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.itemAddedBy}>Added by {item.addedBy}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
              <Trash2 size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ListTodo size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Household List is Empty</Text>
            <Text style={styles.emptyDesc}>
              Add daily essentials or use the AI recipe generator above to plan meals together.
            </Text>
          </View>
        }
      />
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
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  clearBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  aiBox: {
    backgroundColor: '#ecfdf5',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#047857',
  },
  aiDesc: {
    fontSize: 11,
    color: '#065f46',
    marginBottom: 10,
  },
  aiInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  aiInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  aiBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBtnDisabled: {
    opacity: 0.5,
  },
  aiBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  quickChips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  addIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 10,
  },
  statsRow: {
    marginBottom: 4,
  },
  statsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemCardCompleted: {
    backgroundColor: '#f8fafc',
    opacity: 0.7,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  itemQty: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  metaDot: {
    color: '#cbd5e1',
    fontSize: 10,
  },
  itemCategory: {
    fontSize: 11,
    color: '#64748b',
  },
  itemAddedBy: {
    fontSize: 10,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  deleteBtn: {
    padding: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});
