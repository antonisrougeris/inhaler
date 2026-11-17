"use client";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Rotate3D, ZoomIn, X } from "lucide-react";
import { t, type Locale } from "@/lib/brand";
const Model = dynamic(() => import("./viewer-canvas"), {
  ssr: false,
  loading: () => <p>Loading viewer…</p>,
});
export function ProductViewer({
  image,
  modelUrl,
  color,
  locale,
}: {
  image: string;
  modelUrl?: string | null;
  color: string;
  locale: Locale;
}) {
  const [three, setThree] = useState(false),
    [allowed, setAllowed] = useState(false);
  const zoom = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    setAllowed(
      !!canvas.getContext("webgl2") &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);
  return (
    <div className="viewer">
      {three ? (
        <Model color={color} modelUrl={modelUrl} />
      ) : (
        <img
          className="viewer-image"
          src={image}
          alt={t(
            locale,
            "Ενδεικτική απεικόνιση προϊόντος",
            "Illustrative product concept",
          )}
        />
      )}
      <div className="viewer-tools">
        <button onClick={() => zoom.current?.showModal()}>
          <ZoomIn size={17} />
          {t(locale, "Μεγέθυνση", "Zoom")}
        </button>
        {allowed && (
          <button onClick={() => setThree(!three)}>
            <Rotate3D size={17} />
            {three ? "2D" : "3D"}
          </button>
        )}
      </div>
      <span className="viewer-caption">
        {t(
          locale,
          "ΕΝΔΕΙΚΤΙΚΗ ΑΠΕΙΚΟΝΙΣΗ · ΟΧΙ ΤΕΛΙΚΟ ΠΡΟΪΟΝ",
          "ILLUSTRATIVE CONCEPT · NOT THE FINAL PRODUCT",
        )}
      </span>
      <dialog ref={zoom} className="zoom-dialog">
        <button
          className="close"
          onClick={() => zoom.current?.close()}
          aria-label="Close"
        >
          <X />
        </button>
        <img src={image} alt="Product concept enlarged" />
      </dialog>
    </div>
  );
}
