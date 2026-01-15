import GiftCardBrand from '@/models/giftcard-brand.model';
import GiftCardCategory from '@/models/giftcard-category.model';
import GiftCardSale from '@/models/giftcard-sale.model';

// --- BRAND SERVICES ---
export const createBrand = (data: any) => GiftCardBrand.create(data);
export const getAllBrands = () => GiftCardBrand.find().sort({ name: 1 });
export const updateBrand = (id: string, data: any) => GiftCardBrand.findByIdAndUpdate(id, data, { new: true });

// --- CATEGORY SERVICES ---
export const createCategory = (data: any) => GiftCardCategory.create(data);
export const getCategoriesByBrand = (brandId: string) => GiftCardCategory.find({ brandId, isActive: true });
export const updateCategory = (id: string, data: any) => GiftCardCategory.findByIdAndUpdate(id, data, { new: true });

// --- SALE SERVICES ---
export const createSaleEntry = (data: any) => GiftCardSale.create(data);
export const getSalesByStatus = (status?: string) => {
  const query = status ? { status } : {};
  return GiftCardSale.find(query).populate('userId categoryId').sort({ createdAt: -1 });
};
export const updateSaleStatus = (id: string, status: string, adminComment?: string) => 
  GiftCardSale.findByIdAndUpdate(id, { status, adminComment }, { new: true });
