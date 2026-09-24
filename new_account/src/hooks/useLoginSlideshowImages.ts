import { useQuery } from "@tanstack/react-query";
import { getLoginSlideshowImages } from "../api/LoginSlideshow/LoginSlideshowApi";
import index1 from "../assets/645bd8c2478c94d2d379d7388b069fad.png";
import index2 from "../assets/2016e0ff123f8731d5507f751adbb24d.png";
import index3 from "../assets/58629c28c29af472c2e7f5a7527ec6af.png";
import index4 from "../assets/99925897a696e03d965d544901fc8746.png";
import index5 from "../assets/e2104bc248c4786a229b9a5cf8b00b1c.png";
import index6 from "../assets/f7f7e9ff7fbd9f51474d40d41eb11867.png";

const DEFAULT_SLIDES = [
  { src: index1, alt: "Slide 1" },
  { src: index2, alt: "Slide 2" },
  { src: index3, alt: "Slide 3" },
  { src: index4, alt: "Slide 4" },
  { src: index5, alt: "Slide 5" },
  { src: index6, alt: "Slide 6" },
];

/**
 * Login/Signup page slideshow images — managed via Setup > Maintenance >
 * Slideshow Images. Falls back to the built-in defaults when none have been
 * uploaded yet, or if the request fails (e.g. before the backend has run
 * the new migration).
 */
export function useLoginSlideshowImages() {
  const { data } = useQuery({
    queryKey: ["loginSlideshowImages"],
    queryFn: getLoginSlideshowImages,
    retry: false,
  });

  if (!data || data.length === 0) {
    return DEFAULT_SLIDES;
  }

  return data.map((img, index) => ({ src: img.url, alt: `Slide ${index + 1}` }));
}
