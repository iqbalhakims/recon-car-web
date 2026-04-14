function generateMessage(car) {
  const refNo = `REF-${String(car.id).padStart(4, '0')}`;
  const loanAmount = Math.round(car.price * 0.9);
  const totalPayable = loanAmount + loanAmount * 0.035 * 7;
  const monthly = Math.ceil(totalPayable / (7 * 12));

  return `Hi boss 👋

🚗 *${car.model}*
Ref: ${refNo}
Mileage: ${car.mileage?.toLocaleString()} km
Price: RM${car.price?.toLocaleString()}

💰 *Loan Calculator (est.)*
Loan Amount: RM${loanAmount.toLocaleString()}
Monthly Instalment: ~RM${monthly.toLocaleString()}/month
(90% loan, 3.5% flat, 7 years)

Full loan can arrange ✅
Low deposit ✅

Interested? I can arrange viewing 👍`.trim();
}

module.exports = { generateMessage };
