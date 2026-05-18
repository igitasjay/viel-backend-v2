import GiftCardBrand from '@/giftcard-infra/models/giftcard-brand.model';
import GiftCardSale from '@/giftcard-infra/models/giftcard-sale.model';
import { LedgerService } from '@/crypto-infra/services/ledger.service';

// --- BRAND SERVICES ---
export const createBrand = (data: any) => GiftCardBrand.create(data);
export const getAllBrands = () => GiftCardBrand.find().sort({ name: 1 });

export const updateBrand = (id: string, data: any) =>
  GiftCardBrand.findByIdAndUpdate(id, data, { new: true });
export const getBrandById = (id: string) => GiftCardBrand.findById(id);

// --- Incremental Brand Updates ---
export const pushCountry = (brandId: string, country: any) =>
  GiftCardBrand.findByIdAndUpdate(
    brandId,
    { $push: { countries: country } },
    { new: true },
  );

export const pushRange = (brandId: string, iso: string, range: any) =>
  GiftCardBrand.findOneAndUpdate(
    { _id: brandId, 'countries.iso': iso },
    { $push: { 'countries.$.ranges': range } },
    { new: true },
  );

export const pushType = (
  brandId: string,
  iso: string,
  range: string,
  type: any,
) =>
  GiftCardBrand.findOneAndUpdate(
    { _id: brandId },
    { $push: { 'countries.$[c].ranges.$[r].types': type } },
    {
      new: true,
      arrayFilters: [{ 'c.iso': iso }, { 'r.range': range }],
    },
  );

// --- SALE SERVICES ---
export const createSaleEntry = (data: any) => GiftCardSale.create(data);
export const getSaleById = (id: string) => GiftCardSale.findById(id);
export const getSalesByStatus = (status?: string) => {
  const query = status ? { status: status as any } : {};
  return GiftCardSale.find(query)
    .populate('userId brandId')
    .sort({ createdAt: -1 });
};
export const updateSaleStatus = async (
  id: string,
  status: string,
  adminComment?: string,
) => {
  const sale = await GiftCardSale.findByIdAndUpdate(
    id,
    { status, adminComment },
    { new: true },
  );
  if (sale) {
    await LedgerService.updateLedgerStatus(`GCS|${sale._id}`, status);
  }
  return sale;
};
