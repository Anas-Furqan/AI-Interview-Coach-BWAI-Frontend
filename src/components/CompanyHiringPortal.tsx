'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useInterviewContext } from '@/app/context/InterviewContext';

interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  salary: string;
  posted: string;
  applicationsCount: number;
  matchesCount: number;
}

const DEFAULT_JOBS: Job[] = [
  {
    id: 'job-001',
    title: 'Senior React Developer',
    company: 'TechCorp',
    description: 'Looking for React specialist with 5+ years experience',
    salary: '$150k - $200k',
    posted: '2026-04-20',
    applicationsCount: 15,
    matchesCount: 12,
  },
  {
    id: 'job-002',
    title: 'Full Stack Developer',
    company: 'StartupXYZ',
    description: 'MERN stack expert needed',
    salary: '$120k - $150k',
    posted: '2026-04-15',
    applicationsCount: 23,
    matchesCount: 18,
  },
  {
    id: 'job-003',
    title: 'DevOps Engineer',
    company: 'CloudSys',
    description: 'AWS and Kubernetes expertise required',
    salary: '$140k - $180k',
    posted: '2026-04-18',
    applicationsCount: 9,
    matchesCount: 7,
  },
];

export default function CompanyHiringPortal() {
  const { language } = useInterviewContext();
  const [jobs, setJobs] = useState<Job[]>(DEFAULT_JOBS);
  const [dialog, setDialog] = useState({ open: false, mode: 'create' as 'create' | 'edit', data: { id: '', title: '', company: '', description: '', salary: '' } });

  const isUrdu = language === 'ur';
  const copy = useMemo(
    () =>
      isUrdu
        ? {
            title: 'کمپنی ہائرنگ پورٹل',
            subtitle: 'اوپن جابز بنائیں، ترمیم کریں، اور امیدوار میچنگ میں اپ ڈیٹ رہیں۔',
            createJob: 'نئی جاب بنائیں',
            editJob: 'جاب ترمیم کریں',
            titleField: 'جاب ٹائٹل',
            companyField: 'کمپنی',
            descriptionField: 'تفصیل',
            salaryField: 'تنخواہ',
            save: 'محفوظ کریں',
            cancel: 'منسوخ کریں',
            delete: 'حذف کریں',
          }
        : {
            title: 'Company Hiring Portal',
            subtitle: 'Create, edit, and manage job postings with quick match insights.',
            createJob: 'Create New Job',
            editJob: 'Edit Job',
            titleField: 'Job Title',
            companyField: 'Company',
            descriptionField: 'Description',
            salaryField: 'Salary',
            save: 'Save Job',
            cancel: 'Cancel',
            delete: 'Delete',
          },
    [isUrdu]
  );

  const openDialog = (mode: 'create' | 'edit', job?: Job) => {
    setDialog({
      open: true,
      mode,
      data: job
        ? { id: job.id, title: job.title, company: job.company, description: job.description, salary: job.salary }
        : { id: '', title: '', company: '', description: '', salary: '' },
    });
  };

  const handleSave = () => {
    if (!dialog.data.title || !dialog.data.company || !dialog.data.description || !dialog.data.salary) {
      return;
    }

    if (dialog.mode === 'create') {
      const newJob: Job = {
        ...dialog.data,
        id: `job-${Date.now()}`,
        posted: new Date().toISOString().slice(0, 10),
        applicationsCount: 0,
        matchesCount: 0,
      } as Job;
      setJobs((current) => [newJob, ...current]);
    } else {
      setJobs((current) => current.map((job) => (job.id === dialog.data.id ? { ...job, ...dialog.data } : job)));
    }

    setDialog((current) => ({ ...current, open: false }));
  };

  const handleDelete = (id: string) => {
    setJobs((current) => current.filter((job) => job.id !== id));
  };

  return (
    <Box className="pro-page" minHeight="100vh" py={{ xs: 3, md: 5 }}>
      <Box maxWidth="1200px" mx="auto">
        <Stack spacing={4}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h3" fontWeight={800} gutterBottom>
                {copy.title}
              </Typography>
              <Typography color="text.secondary">{copy.subtitle}</Typography>
            </Box>
            <Button variant="contained" onClick={() => openDialog('create')}>
              {copy.createJob}
            </Button>
          </Box>

          <Grid container spacing={3}>
            {jobs.map((job) => (
              <Grid item xs={12} md={6} key={job.id}>
                <Card className="pro-panel">
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography variant="h6" fontWeight={700}>{job.title}</Typography>
                      <Typography color="text.secondary">{job.company}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 1 }}>{job.description}</Typography>
                      <Typography variant="body2" color="text.secondary">{job.salary}</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                        <Chip label={`Apps: ${job.applicationsCount}`} size="small" />
                        <Chip label={`Matches: ${job.matchesCount}`} size="small" />
                        <Chip label={`Posted: ${job.posted}`} size="small" />
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Button size="small" startIcon={<EditIcon />} onClick={() => openDialog('edit', job)}>
                          {copy.editJob}
                        </Button>
                        <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(job.id)}>
                          {copy.delete}
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Box>

      <Dialog open={dialog.open} onClose={() => setDialog((current) => ({ ...current, open: false }))}>
        <DialogTitle>{dialog.mode === 'create' ? copy.createJob : copy.editJob}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ minWidth: 360, mt: 1 }}>
            <TextField
              label={copy.titleField}
              value={dialog.data.title}
              onChange={(event) => setDialog((current) => ({ ...current, data: { ...current.data, title: event.target.value } }))}
              fullWidth
              sx={{ backgroundColor: 'rgba(15, 23, 42, 0.8)' }}
            />
            <TextField
              label={copy.companyField}
              value={dialog.data.company}
              onChange={(event) => setDialog((current) => ({ ...current, data: { ...current.data, company: event.target.value } }))}
              fullWidth
              sx={{ backgroundColor: 'rgba(15, 23, 42, 0.8)' }}
            />
            <TextField
              label={copy.descriptionField}
              value={dialog.data.description}
              onChange={(event) => setDialog((current) => ({ ...current, data: { ...current.data, description: event.target.value } }))}
              fullWidth
              multiline
              minRows={4}
              sx={{ backgroundColor: 'rgba(15, 23, 42, 0.8)' }}
            />
            <TextField
              label={copy.salaryField}
              value={dialog.data.salary}
              onChange={(event) => setDialog((current) => ({ ...current, data: { ...current.data, salary: event.target.value } }))}
              fullWidth
              sx={{ backgroundColor: 'rgba(15, 23, 42, 0.8)' }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog((current) => ({ ...current, open: false }))}>{copy.cancel}</Button>
          <Button variant="contained" onClick={handleSave}>{copy.save}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
