export const purchaseEmailHtml = (purchase: any) => {
  return `
<h2>Thank you for your purchase</h2>
<p>Purchase ID: ${purchase._id}</p>
<p>Brand: ${purchase.detailsSnapshot.brandName}</p>
<p>Amount (each): ${purchase.amount}</p>
<p>Quantity: ${purchase.quantity}</p>
<p>Total (NGN): ${purchase.totalInNaira.toLocaleString()}</p>
<hr />
<h3>Instructions</h3>
<p>${purchase.detailsSnapshot.instruction}</p>
`;
};
