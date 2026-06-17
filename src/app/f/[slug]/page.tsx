import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FUNNEL_OFFERS, getOffer } from "@/lib/funnels-config";
import { OfferLanding } from "./offer-landing";

export function generateStaticParams() {
  return FUNNEL_OFFERS.map((o) => ({ slug: o.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const offer = getOffer(params.slug);
  if (!offer) return { title: "bilimdibol" };
  return {
    title: `${offer.title} — bilimdibol`,
    description: offer.subtitle,
  };
}

export default function FunnelPage({ params }: { params: { slug: string } }) {
  const offer = getOffer(params.slug);
  if (!offer) notFound();
  return <OfferLanding offer={offer} />;
}
