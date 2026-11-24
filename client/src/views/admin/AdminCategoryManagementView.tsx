import React, { useState, useEffect } from 'react';
import { ProductCategory } from '../../types';
import { request } from '../../api/client';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Search,
  ArrowUpDown,
  Tag,
  Package,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

export const AdminCategoryManagementView: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [modalParentId, setModalParentId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formSlug, setFormSlug] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formBannerUrl, setFormBannerUrl] = useState<string>('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formIsHomepageVisible, setFormIsHomepageVisible] = useState<boolean>(true);
  const [formDepartment, setFormDepartment] = useState<string>('GROCERY');
  const [formMetaTitle, setFormMetaTitle] = useState<string>('');
  const [formMetaDescription, setFormMetaDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await request<{ categories: ProductCategory[] }>('/categories?includeInactive=true');
      if (res.categories) {
        setCategories(res.categories);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreateModal = (parentId: string | null = null) => {
    setEditingCategory(null);
    setModalParentId(parentId);
    setFormName('');
    setFormSlug('');
    setFormDesc('');
    setFormImageUrl(parentId ? '/assets/categories/fruits-vegetables.svg' : '/assets/categories/atta-dal.svg');
    setFormBannerUrl('');
    setFormDisplayOrder(categories.length + 1);
    setFormIsActive(true);
    setFormIsHomepageVisible(parentId === null);
    setFormDepartment('GROCERY');
    setFormMetaTitle('');
    setFormMetaDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: ProductCategory) => {
    setEditingCategory(cat);
    setModalParentId(cat.parentId || null);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDesc(cat.description || '');
    setFormImageUrl(cat.imageUrl || '');
    setFormBannerUrl(cat.bannerUrl || '');
    setFormDisplayOrder(cat.displayOrder);
    setFormIsActive(cat.isActive);
    setFormIsHomepageVisible(cat.isHomepageVisible);
    setFormDepartment(cat.department || 'GROCERY');
    setFormMetaTitle(cat.metaTitle || '');
    setFormMetaDescription(cat.metaDescription || '');
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingCategory) {
      // Auto-generate slug
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormSlug(generated);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) {
      alert('Name and slug are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        name: formName.trim(),
        slug: formSlug.trim(),
        description: formDesc.trim(),
        imageUrl: formImageUrl.trim(),
        bannerUrl: formBannerUrl.trim() || undefined,
        displayOrder: formDisplayOrder,
        isActive: formIsActive,
        isHomepageVisible: formIsHomepageVisible,
        department: formDepartment,
        metaTitle: formMetaTitle.trim() || undefined,
        metaDescription: formMetaDescription.trim() || undefined,
        parentId: modalParentId
      };

      if (editingCategory) {
        await request(`/categories/admin/${editingCategory.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setSuccessMessage(`Category "${formName}" updated successfully`);
      } else {
        await request('/categories/admin/create', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setSuccessMessage(`Category "${formName}" created successfully`);
      }

      setIsModalOpen(false);
      await fetchCategories();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cat: ProductCategory) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete category "${cat.name}"? If it has active products mapped, deletion will be blocked.`
    );
    if (!confirmDelete) return;

    try {
      setError(null);
      await request(`/categories/admin/${cat.id}`, {
        method: 'DELETE'
      });
      setSuccessMessage(`Category "${cat.name}" deleted successfully`);
      await fetchCategories();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const handleToggleActive = async (cat: ProductCategory) => {
    try {
      await request(`/categories/admin/${cat.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !cat.isActive })
      });
      await fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleToggleHomepage = async (cat: ProductCategory) => {
    try {
      await request(`/categories/admin/${cat.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isHomepageVisible: !cat.isHomepageVisible })
      });
      await fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle homepage visibility');
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase();
    const matchMain = cat.name.toLowerCase().includes(q) || cat.slug.toLowerCase().includes(q);
    const matchSub = cat.children?.some((s) => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q));
    return matchMain || matchSub;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Category & Department Management</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold">
                {categories.length} Aisles
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Configure homepage aisles, nested subcategories, display order and visibility
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={fetchCategories}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh categories"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => openCreateModal(null)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-2 text-xs font-bold text-emerald-800">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-2xl p-4 flex items-center gap-2 text-xs font-bold text-red-800">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search categories or subcategories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <span className="text-xs text-slate-500 font-bold hidden sm:inline">
          {filteredCategories.length} Categories Found
        </span>
      </div>

      {/* 3. Category Tree / Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">Category & Subcategories</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Homepage</th>
                <th className="py-3 px-4 text-center">Products</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.map((cat, idx) => {
                const isExpanded = expandedCategoryIds.has(cat.id);
                const subcategories = cat.children || [];

                return (
                  <React.Fragment key={cat.id}>
                    {/* Main Category Row */}
                    <tr className="hover:bg-amber-50/30 transition-colors font-medium">
                      <td className="py-3 px-4 font-black text-slate-400">{cat.displayOrder || idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleExpand(cat.id)}
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                            title={isExpanded ? 'Collapse subcategories' : 'Expand subcategories'}
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>

                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 p-1 flex-shrink-0 flex items-center justify-center">
                            <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-contain" />
                          </div>

                          <div>
                            <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{cat.name}</span>
                              <span className="text-[10px] font-semibold text-slate-400">({cat.slug})</span>
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1 max-w-md">
                              {cat.description || 'No description provided'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700">
                          {cat.department || 'GROCERY'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(cat)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer transition ${
                            cat.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleHomepage(cat)}
                          className={`p-1.5 rounded-xl border transition cursor-pointer ${
                            cat.isHomepageVisible
                              ? 'bg-amber-50 border-amber-300 text-amber-700'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                          title={cat.isHomepageVisible ? 'Visible on Homepage' : 'Hidden from Homepage'}
                        >
                          {cat.isHomepageVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-800">{cat._count?.products || 0}</span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openCreateModal(cat.id)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-amber-600 transition"
                            title="Add subcategory"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition"
                            title="Edit category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
                            title="Delete category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Subcategories Expansion */}
                    {isExpanded &&
                      subcategories.map((sub, sIdx) => (
                        <tr key={sub.id} className="bg-slate-50/50 hover:bg-slate-100/60 transition-colors text-[11px]">
                          <td className="py-2.5 px-4 text-slate-400 pl-8">{`${cat.displayOrder}.${sIdx + 1}`}</td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5 pl-6">
                              <span className="text-slate-300 font-bold">â””</span>
                              <div>
                                <span className="font-extrabold text-slate-800">{sub.name}</span>
                                <span className="text-[10px] text-slate-400 ml-1.5">({sub.slug})</span>
                                {sub.description && (
                                  <div className="text-[10px] text-slate-500 line-clamp-1">{sub.description}</div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-2.5 px-4">
                            <span className="text-[10px] text-slate-500">Subcategory</span>
                          </td>

                          <td className="py-2.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleActive(sub)}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase cursor-pointer ${
                                sub.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {sub.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>

                          <td className="py-2.5 px-4 text-center">
                            <span className="text-slate-300">â€”</span>
                          </td>

                          <td className="py-2.5 px-4 text-center">
                            <span className="font-bold text-slate-600">{sub._count?.products || 0}</span>
                          </td>

                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(sub)}
                                className="p-1 rounded-md border border-slate-200 text-slate-500 hover:text-blue-600"
                                title="Edit subcategory"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(sub)}
                                className="p-1 rounded-md border border-slate-200 text-slate-500 hover:text-red-600"
                                title="Delete subcategory"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Create / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingCategory ? 'Edit Category' : modalParentId ? 'Create New Subcategory' : 'Create New Category'}
                </h3>
                <p className="text-xs text-slate-500">
                  {modalParentId
                    ? `Nested under ${categories.find((c) => c.id === modalParentId)?.name || 'Parent Category'}`
                    : 'Configure category details and marketplace display'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Atta, Rice & Dal"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Slug (URL identifier) *</label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g. atta-rice-dal"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Short aisle overview for customer discovery"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Image Asset Path *</label>
                  <input
                    type="text"
                    required
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="/assets/categories/name.svg"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department</label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-800"
                  >
                    <option value="GROCERY">Grocery & Daily Essentials</option>
                    <option value="FASHION">Fashion & Apparel</option>
                    <option value="ELECTRONICS">Electronics & Gadgets</option>
                    <option value="LIFESTYLE">Lifestyle & Home</option>
                    <option value="SERVICES">Local Services</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span className="font-bold text-slate-700">Active</span>
                  </label>

                  {!modalParentId && (
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsHomepageVisible}
                        onChange={(e) => setFormIsHomepageVisible(e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span className="font-bold text-slate-700">Homepage</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">SEO Metadata (Optional)</span>
                <div>
                  <input
                    type="text"
                    value={formMetaTitle}
                    onChange={(e) => setFormMetaTitle(e.target.value)}
                    placeholder="SEO Meta Title"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-[11px]"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={formMetaDescription}
                    onChange={(e) => setFormMetaDescription(e.target.value)}
                    placeholder="SEO Meta Description"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-[11px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black shadow-xs transition"
                >
                  {isSubmitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
