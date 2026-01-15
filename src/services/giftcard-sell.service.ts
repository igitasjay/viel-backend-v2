import GiftCardBrand from '@/models/giftcard-brand.model';
import GiftCardSale from '@/models/giftcard-sale.model';

// --- BRAND SERVICES ---
export const createBrand = (data: any) => GiftCardBrand.create(data);
export const getAllBrands = () => GiftCardBrand.find().sort({ name: 1 });
export const updateBrand = (id: string, data: any) => GiftCardBrand.findByIdAndUpdate(id, data, { new: true });
export const getBrandById = (id: string) => GiftCardBrand.findById(id);

// --- SALE SERVICES ---
export const createSaleEntry = (data: any) => GiftCardSale.create(data);
export const getSalesByStatus = (status?: string) => {
  const query = status ? { status } : {};
  return GiftCardSale.find(query).populate('userId brandId').sort({ createdAt: -1 });
};
export const updateSaleStatus = (id: string, status: string, adminComment?: string) => 
  GiftCardSale.findByIdAndUpdate(id, { status, adminComment }, { new: true });
