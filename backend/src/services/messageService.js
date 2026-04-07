function generateMessage(car) {
  return `Hi boss 👋

${car.model}
Mileage: ${car.mileage} km
Price: RM${car.price}

Full loan can arrange ✅
Low deposit ✅

Interested? I can arrange viewing 👍`.trim();
}

module.exports = { generateMessage };
