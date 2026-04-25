import creamHoodie from "@/assets/product-cream-hoodie.jpg";
import creamSweats from "@/assets/product-cream-sweats.jpg";
import charcoalHoodie from "@/assets/product-charcoal-hoodie.jpg";
import charcoalSweats from "@/assets/product-charcoal-sweats.jpg";
import blackJeans from "@/assets/product-black-jeans.jpg";
import blueJeans from "@/assets/product-blue-jeans.jpg";
import sherpa from "@/assets/product-sherpa.jpg";

export type Product = {
  slug: string;
  name: string;
  price: number;
  image: string;
  hoverImage: string;
  soldOut?: boolean;
  category: "drop" | "previous";
};

export const dropProducts: Product[] = [
  { slug: "cream-hoodie", name: "Cream Hoodie", price: 69.99, image: creamHoodie, hoverImage: charcoalHoodie, category: "drop" },
  { slug: "cream-baggy-sweatpants", name: "Cream Baggy Sweatpants", price: 69.99, image: creamSweats, hoverImage: charcoalSweats, category: "drop" },
  { slug: "charcoal-hoodie", name: "Charcoal Hoodie", price: 69.99, image: charcoalHoodie, hoverImage: creamHoodie, category: "drop" },
  { slug: "charcoal-baggy-sweatpants", name: "Charcoal Baggy Sweatpants", price: 69.99, image: charcoalSweats, hoverImage: creamSweats, category: "drop" },
  { slug: "black-jeans", name: "Black Jeans", price: 79.99, image: blackJeans, hoverImage: blueJeans, category: "drop" },
  { slug: "indigo-jeans", name: "Indigo Jeans", price: 79.99, image: blueJeans, hoverImage: blackJeans, category: "drop" },
  { slug: "sherpa-jacket", name: "Sherpa Jacket", price: 109.99, image: sherpa, hoverImage: creamHoodie, category: "drop" },
];

export const previousProducts: Product[] = [
  { slug: "black-hoodie", name: "Black Hoodie", price: 69.99, image: charcoalHoodie, hoverImage: charcoalSweats, soldOut: true, category: "previous" },
  { slug: "black-baggy-sweatpants", name: "Black Baggy Sweatpants", price: 69.99, image: charcoalSweats, hoverImage: charcoalHoodie, soldOut: true, category: "previous" },
  { slug: "gray-hoodie", name: "Gray Hoodie", price: 69.99, image: creamHoodie, hoverImage: creamSweats, soldOut: true, category: "previous" },
  { slug: "gray-baggy-sweatpants", name: "Gray Baggy Sweatpants", price: 69.99, image: creamSweats, hoverImage: creamHoodie, soldOut: true, category: "previous" },
];

export const allProducts = [...dropProducts, ...previousProducts];

export function getProduct(slug: string) {
  return allProducts.find((p) => p.slug === slug);
}