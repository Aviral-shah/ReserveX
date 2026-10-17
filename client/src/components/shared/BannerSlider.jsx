import React from "react";
import Slider from "react-slick";
import { banners } from "../../utils/constants";

const BannerSlider = () => {
  const settings = {
    centerMode: true,
    centerPadding: "240px",
    slidesToShow: 1,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 3000,
    speed: 800,
    arrows: true,
    dots: true,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          centerMode: true,
          centerPadding: "140px",
        },
      },
      {
        breakpoint: 1024,
        settings: {
          centerMode: true,
          centerPadding: "60px",
        },
      },
      {
        breakpoint: 768,
        settings: {
          centerMode: false,
          centerPadding: "0px",
          arrows: false,
          dots: true,
        },
      },
    ],
  };

  return (
    <div className="w-full bg-white py-3 md:py-6 overflow-hidden">
      <div className="mx-auto px-2 md:px-4 max-w-screen-2xl">
        <Slider {...settings}>
          {banners.map((banner, i) => (
            <div key={i} className="px-1 md:px-2 outline-none">
              <img
                src={banner}
                alt={`banner-${i}`}
                className="w-full h-[180px] sm:h-[240px] md:h-[300px] rounded-xl object-cover"
              />
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default BannerSlider;
