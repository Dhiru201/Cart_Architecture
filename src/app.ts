enum ItemType {
  CAR,
  BIKE,
  SCOOTER,
}
interface CartItem {
  readonly itemType: ItemType;
  readonly sellerPrice: number;
  afterDiscountPrice: number;
}
interface CartCoupon {
  setDiscount(cart: ShoppingCart, position: number): void;
}

type ItemORCoupon = CartItem | CartCoupon;
const isItem = (item: ItemORCoupon): item is CartItem => "itemType" in item;

class ShoppingCart {
  readonly items: ItemORCoupon[];
  readonly productTypeRecord: Record<ItemType, CartItem[]>;

  constructor(items: ItemORCoupon[]) {
    this.items = items;
    this.productTypeRecord = {
      [ItemType.CAR]: [],
      [ItemType.BIKE]: [],
      [ItemType.SCOOTER]: [],
    };
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (isItem(item)) {
        this.productTypeRecord[item.itemType].push(item);
      }
    }

    for (let i = 0; i < this.items.length; i++) {
      const coupon = this.items[i];
      if (!isItem(coupon)) {
        coupon.setDiscount(this, i);
      }
    }
  }

  finalPrice(): number {
    var totalPrice = 0;
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (isItem(item)) {
        totalPrice += item.afterDiscountPrice;
      }
    }
    return totalPrice;
  }

  withoutDiscountPrice(): number {
    var price = 0;
    for (let itemType in this.productTypeRecord) {
      let items = this.productTypeRecord[itemType];
      for (let i = 0; i < items.length; i++) {
        price += items[i].sellerPrice;
      }
    }
    return price;
  }
}

class PercentageDiscountCoupon implements CartCoupon {
  private readonly discountPercentage: number;
  constructor(discount: number) {
    this.discountPercentage = discount;
  }
  setDiscount(cart: ShoppingCart, _: number): void {
    for (let i = 0; i < cart.items.length; i++) {
      if (isItem(cart.items[i])) {
        const discount =
          (cart.items[i] as CartItem).afterDiscountPrice *
          (1 - this.discountPercentage / 100);
        (cart.items[i] as CartItem).afterDiscountPrice = Math.max(0, discount);
      }
    }
  }
}

class NextProductPercentageDiscount implements CartCoupon {
  private readonly discountPercentage: number;

  constructor(discount: number) {
    this.discountPercentage = discount;
  }

  setDiscount(cart: ShoppingCart, position: number): void {
    for (let i = position + 1; i < cart.items.length; i++) {
      if (isItem(cart.items[i])) {
        const discount =
          (cart.items[i] as CartItem).afterDiscountPrice *
          (1 - this.discountPercentage / 100);
        (cart.items[i] as CartItem).afterDiscountPrice = Math.max(0, discount);
        return;
      }
    }
  }
}

class NthProductPercentageDiscount implements CartCoupon {
  private readonly discountPercentage: number;
  private nthItem: number;

  constructor(nthItem: number, discount: number) {
    this.discountPercentage = discount;
    this.nthItem = nthItem;
  }

  setDiscount(cart: ShoppingCart, position: number): void {
    let nthProductIndex = position;
    this.nthItem = this.nthItem + position;
    for (let i = 0; i < cart.items.length; i++) {
      if (isItem(cart.items[i])) {
        nthProductIndex++;
        if (nthProductIndex == this.nthItem) {
          const discount =
            (cart.items[i] as CartItem).afterDiscountPrice *
            (1 - this.discountPercentage / 100);
          (cart.items[i] as CartItem).afterDiscountPrice = Math.max(
            0,
            discount
          );
          return;
        }
      }
    }
  }
}

class NthProductAmountDiscountByType implements CartCoupon {
  private readonly discountAmount: number;
  private readonly type: ItemType;
  private readonly nthProduct: number;

  constructor(nthProduct: number, amount: number, type: ItemType) {
    this.discountAmount = amount;
    this.nthProduct = nthProduct;
    this.type = type;
  }

  setDiscount(cart: ShoppingCart, _: number): void {
    const selecteProductTypeRecord = cart.productTypeRecord[this.type];
    const nthItem = selecteProductTypeRecord[this.nthProduct - 1];
    if (nthItem) {
      (nthItem as CartItem).afterDiscountPrice = Math.max(
        0,
        (nthItem as CartItem).afterDiscountPrice - this.discountAmount
      );
    }
  }
}
class Item implements CartItem {
  readonly itemType: ItemType;
  readonly sellerPrice: number;
  afterDiscountPrice: number;

  constructor(price: number, type: ItemType) {
    this.sellerPrice = price;
    this.afterDiscountPrice = price;
    this.itemType = type;
  }
}
const coupon1 = new PercentageDiscountCoupon(25);
const coupon2 = new NthProductPercentageDiscount(1, 50);
const coupon4 = new NthProductAmountDiscountByType(2, 2, ItemType.CAR);
const coupon3 = new NextProductPercentageDiscount(10);
const item1 = new Item(10, ItemType.CAR);
const item2 = new Item(10, ItemType.CAR);
const item3 = new Item(15, ItemType.SCOOTER);

const cart = new ShoppingCart([item1, coupon4, coupon1, coupon3, item2]);
console.log("FINAL PRICE", cart.finalPrice());
