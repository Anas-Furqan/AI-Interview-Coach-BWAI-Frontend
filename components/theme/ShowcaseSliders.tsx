'use client';

import { Box, Typography } from '@mui/material';
// @ts-expect-error - Splide types issue
import { Splide, SplideSlide } from '@splidejs/react-splide';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

const SPLIDE_ITEMS = [
  { title: 'Live Coaching', subtitle: 'Real-time guidance while you answer' },
  { title: 'Speech Intelligence', subtitle: 'Track pace, fillers, and clarity instantly' },
  { title: 'Role Context', subtitle: 'Questions tuned for Pakistan market roles' },
  { title: 'Action Reports', subtitle: 'Pinpoint what to improve next' },
];

const SWIPER_ITEMS = [
  { title: 'Smooth Loader', subtitle: 'Transitions feel polished and premium' },
  { title: '3D Motion', subtitle: 'Cards react naturally on hover and pointer move' },
  { title: 'Entrance Reveal', subtitle: 'Sections animate in as you scroll' },
  { title: 'Micro Interactions', subtitle: 'Buttons and cards respond with subtle depth' },
  { title: 'Parallax Effect', subtitle: 'Foreground content glides over atmospheric layers' },
];

export default function ShowcaseSliders() {
  return (
    <Box className="showcase-shell" data-reveal="zoom" data-reveal-delay="160">
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        Motion Showcase
      </Typography>

      <Splide
        options={{
          type: 'loop',
          perPage: 3,
          autoplay: true,
          interval: 2400,
          arrows: true,
          pagination: true,
          gap: '1rem',
          breakpoints: {
            1024: { perPage: 2 },
            700: { perPage: 1 },
          },
        }}
        aria-label="Feature slider"
      >
        {SPLIDE_ITEMS.map(item => (
          <SplideSlide key={item.title}>
            <Box
              className="glass-card micro-hover"
              sx={{ p: 2.5, minHeight: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                {item.title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                {item.subtitle}
              </Typography>
            </Box>
          </SplideSlide>
        ))}
      </Splide>

      <Box sx={{ mt: 3 }}>
        <Swiper
          modules={[Autoplay, EffectCoverflow]}
          effect="coverflow"
          centeredSlides
          loop
          grabCursor
          slidesPerView={1.1}
          autoplay={{ delay: 2600, disableOnInteraction: false }}
          coverflowEffect={{
            rotate: 22,
            stretch: 0,
            depth: 120,
            modifier: 1,
            slideShadows: false,
          }}
          breakpoints={{
            700: { slidesPerView: 2.2 },
            1200: { slidesPerView: 2.8 },
          }}
        >
          {SWIPER_ITEMS.map(item => (
            <SwiperSlide key={item.title}>
              <Box
                className="micro-hover"
                data-tilt
                sx={{
                  minHeight: 120,
                  p: 2.5,
                  borderRadius: 3,
                  border: '1px solid rgba(149, 117, 205, 0.22)',
                  background: 'rgba(43, 47, 79, 0.95)',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  {item.subtitle}
                </Typography>
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>
    </Box>
  );
}
