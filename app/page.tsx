import Link from 'next/link';
import { Box, Button, Container, Stack, Typography } from '@mui/material';

export default function HomePage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(145deg, #eef8ff 0%, #f9fbff 50%, #edf7f3 100%)',
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={3} className="text-center">
          <Typography variant="overline" sx={{ letterSpacing: 1.5, color: 'primary.main', fontWeight: 700 }}>
            BWAI HACKATHON EDITION
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 800 }}>
            AI Interview Coach Pro Max
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            Practice job interviews with live AI feedback, speech intelligence HUD, and role-specific Pakistani hiring context.
          </Typography>
          <Stack direction="row" justifyContent="center">
            <Button component={Link} href="/auth" size="large" variant="contained">
              Get Started
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
