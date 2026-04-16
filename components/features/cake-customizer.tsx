"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useCart } from "@/lib/store/useCart";
import { formatPrice } from "@/lib/utils/price";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ProductWithVariants } from "@/lib/actions/products";

interface CakeCustomizerProps {
  product: ProductWithVariants;
}

const VARIANT_ORDER = ["Porción", "Pequeña", "Mediana", "Grande"];

/**
 * CakeCustomizer - Componente de personalización de tortas
 * 
 * Características:
 * - Galería con imagen principal y miniaturas
 * - Selector de variantes elegante
 * - Guía dinámica de porciones
 * - Precio en tiempo real
 * - Input para mensaje personalizado (máx 40 caracteres)
 * - Integración con carrito Zustand
 * - Animaciones smooth con Framer Motion
 */
export function CakeCustomizer({ product }: CakeCustomizerProps) {
  // Estado
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.product_variants[0]?.id || ""
  );
  const [quantity, setQuantity] = useState(1);
  const [customMessage, setCustomMessage] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Store
  const { addItem } = useCart();

  // Seleccionar variante actual
  const selectedVariant = useMemo(() => {
    return product.product_variants.find((v) => v.id === selectedVariantId);
  }, [selectedVariantId, product.product_variants]);

  // Ordenar variantes para UI
  const sortedVariants = useMemo(() => {
    return [...product.product_variants].sort((a, b) => {
      const indexA = VARIANT_ORDER.indexOf(a.variant_name);
      const indexB = VARIANT_ORDER.indexOf(b.variant_name);
      return indexA - indexB;
    });
  }, [product.product_variants]);

  // Handlers
  const handleAddToCart = async () => {
    if (!selectedVariant) return;

    setIsAddingToCart(true);

    try {
      addItem({
        productId: product.id,
        productName: product.name,
        variantId: selectedVariant.id,
        variantName: selectedVariant.variant_name,
        priceInCents: selectedVariant.price_in_cents,
        quantity,
        customMessage: customMessage || undefined,
      });

      // Reset form
      setQuantity(1);
      setCustomMessage("");

      // Toast de éxito (opcional - integrar con toast library)
      console.log("✅ Producto agregado al carrito");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleQuantityChange = (value: number) => {
    if (value > 0 && value <= 10) {
      setQuantity(value);
    }
  };

  const handleMessageChange = (value: string) => {
    if (value.length <= 40) {
      setCustomMessage(value);
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* GALERÍA - SECTION 1 */}
        <GallerySection product={product} />

        {/* PERSONALIZACIÓN - SECTION 2 */}
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-serif font-light tracking-wide">
              {product.name}
            </h1>
            {product.description && (
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}
            {product.category && (
              <Badge variant="secondary" className="w-fit">
                {product.category}
              </Badge>
            )}
          </div>

          {/* SELECTOR DE VARIANTES */}
          <VariantSelector
            variants={sortedVariants}
            selectedVariantId={selectedVariantId}
            onVariantChange={setSelectedVariantId}
          />

          {/* GUÍA DE PORCIONES (Dinámica) */}
          <AnimatePresence mode="wait">
            {selectedVariant && selectedVariant.servings_suggested && (
              <motion.div
                key={selectedVariant.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-4"
              >
                <p className="text-xs md:text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  Guía de Porciones
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {selectedVariant.servings_suggested}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PRECIO DINÁMICO */}
          <PricingSection
            variant={selectedVariant}
            quantity={quantity}
          />

          {/* SELECTOR DE CANTIDAD */}
          <QuantitySelector
            quantity={quantity}
            onQuantityChange={handleQuantityChange}
          />

          {/* MENSAJE PERSONALIZADO */}
          <MessageCustomizer
            message={customMessage}
            onMessageChange={handleMessageChange}
          />

          {/* BOTÓN AGREGAR AL CARRITO */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleAddToCart}
              disabled={!selectedVariant || isAddingToCart}
              size="lg"
              className="w-full h-12 font-serif text-base"
            >
              {isAddingToCart
                ? "Agregando..."
                : `Agregar al carrito`}
            </Button>
          </motion.div>

          {/* INFORMACIÓN ADICIONAL */}
          <div className="space-y-2 pt-4 border-t border-border/50">
            <InfoRow label="Lead time" value="Mínimo 48 horas" />
            <InfoRow
              label="Retiro en domicilio"
              value="Disponible en Río Tercero"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * GallerySection - Galería de imágenes del producto
 */
function GallerySection({ product }: { product: ProductWithVariants }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const images = product.image_url ? [product.image_url] : [];

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Imagen Principal */}
      {images.length > 0 && (
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          <motion.div
            key={selectedImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src={images[selectedImageIndex]}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        </div>
      )}

      {/* Placeholder si no hay imagen */}
      {images.length === 0 && (
        <div className="aspect-square rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-950/50 dark:to-amber-900/30 flex items-center justify-center">
          <p className="text-sm text-muted-foreground font-serif">
            Galería no disponible
          </p>
        </div>
      )}

      {/* Miniaturas (si hay múltiples imágenes en futuro) */}
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((image, index) => (
            <motion.button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`relative aspect-square w-16 overflow-hidden rounded-md border-2 transition-all ${
                selectedImageIndex === index
                  ? "border-amber-600 dark:border-amber-400"
                  : "border-border hover:border-border/70"
              }`}
              whileHover={{ scale: 1.05 }}
            >
              <Image
                src={image}
                alt={`${product.name} thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/**
 * VariantSelector - Selector de variantes con botones elegantes
 */
interface VariantSelectorProps {
  variants: any[];
  selectedVariantId: string;
  onVariantChange: (variantId: string) => void;
}

function VariantSelector({
  variants,
  selectedVariantId,
  onVariantChange,
}: VariantSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-xs md:text-sm font-serif font-semibold text-muted-foreground uppercase tracking-wider">
        Selecciona tu tamaño
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {variants.map((variant) => (
          <motion.button
            key={variant.id}
            onClick={() => onVariantChange(variant.id)}
            className={`relative px-4 py-3 rounded-lg border transition-all font-serif text-sm font-medium ${
              selectedVariantId === variant.id
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-background border-border text-foreground hover:border-primary/50 hover:bg-accent/5"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="space-y-1">
              <div>{variant.variant_name}</div>
              <div className="text-xs opacity-75">
                {formatPrice(variant.price_in_cents)}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/**
 * PricingSection - Muestra precio dinámico y total
 */
interface PricingSectionProps {
  variant: any;
  quantity: number;
}

function PricingSection({ variant, quantity }: PricingSectionProps) {
  if (!variant) return null;

  const unitPrice = variant.price_in_cents;
  const totalPrice = unitPrice * quantity;

  return (
    <motion.div
      className="space-y-2 pt-4 border-t border-border/50"
      layout
    >
      <div className="flex justify-between items-baseline">
        <span className="text-xs md:text-sm text-muted-foreground font-serif">
          Precio unitario
        </span>
        <motion.span
          key={variant.id}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-base md:text-lg font-light"
        >
          {formatPrice(unitPrice)}
        </motion.span>
      </div>
      {quantity > 1 && (
        <div className="flex justify-between items-baseline">
          <span className="text-xs md:text-sm text-muted-foreground font-serif">
            Subtotal
          </span>
          <motion.span
            layout
            className="text-lg md:text-xl font-semibold"
          >
            {formatPrice(totalPrice)}
          </motion.span>
        </div>
      )}
    </motion.div>
  );
}

/**
 * QuantitySelector - Selector de cantidad elegante
 */
interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

function QuantitySelector({
  quantity,
  onQuantityChange,
}: QuantitySelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-xs md:text-sm font-serif font-semibold text-muted-foreground uppercase tracking-wider">
        Cantidad
      </label>
      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => onQuantityChange(quantity - 1)}
          disabled={quantity <= 1}
          className="w-10 h-10 rounded-lg border border-border hover:bg-accent/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          −
        </motion.button>
        <div className="w-12 text-center text-lg font-serif font-light">
          {quantity}
        </div>
        <motion.button
          onClick={() => onQuantityChange(quantity + 1)}
          disabled={quantity >= 10}
          className="w-10 h-10 rounded-lg border border-border hover:bg-accent/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          +
        </motion.button>
      </div>
    </div>
  );
}

/**
 * MessageCustomizer - Input para mensaje personalizado
 */
interface MessageCustomizerProps {
  message: string;
  onMessageChange: (message: string) => void;
}

function MessageCustomizer({
  message,
  onMessageChange,
}: MessageCustomizerProps) {
  const charactersLeft = 40 - message.length;

  return (
    <div className="space-y-2">
      <label className="block text-xs md:text-sm font-serif font-semibold text-muted-foreground uppercase tracking-wider">
        Mensaje en la torta (opcional)
      </label>
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Ej: ¡Feliz Cumpleaños!"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          maxLength={40}
          className="border-border/50 font-serif text-sm placeholder:text-muted-foreground/50"
        />
        <div className="flex justify-end">
          <span
            className={`text-xs transition-colors ${
              charactersLeft <= 5
                ? "text-red-500 dark:text-red-400"
                : "text-muted-foreground"
            }`}
          >
            {charactersLeft} caracteres restantes
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * InfoRow - Fila de información auxiliar
 */
interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex justify-between items-center text-xs md:text-sm">
      <span className="text-muted-foreground font-serif">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
