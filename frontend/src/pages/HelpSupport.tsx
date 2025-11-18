import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Divider,
} from '@mui/material';
import {
  HelpCircle,
  ChevronDown,
  Phone,
  Mail,
  MessageCircle,
  FileText,
  Download,
  ExternalLink,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

const HelpSupport = ({ user, org }) => {
  const [supportForm, setSupportForm] = useState({
    subject: '',
    category: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      question: "How do I start the pre-registration process?",
      answer: "To start pre-registration, navigate to the Pre-Registration section in your sidebar. You'll need to complete 5 steps: Profile Registration, Laboratory Registration, Taster Registration, Competence Certificate Application, and Export License Application. Each step must be completed in order."
    },
    {
      question: "What documents do I need for export license application?",
      answer: "For export license application, you'll need: Business registration certificate, Tax clearance certificate, EIC registration number, Bank statement, Quality certificates from registered laboratories, and Competence certificate from ECTA."
    },
    {
      question: "How long does the approval process take?",
      answer: "The approval timeline varies by application type: Profile Registration (3-5 business days), Laboratory Registration (7-10 business days), Competence Certificate (10-15 business days), Export License (15-20 business days). These are estimated times and may vary based on document completeness."
    },
    {
      question: "Can I track my application status?",
      answer: "Yes! Use the Application Tracking section to monitor all your submissions. You'll see real-time updates on application status, reviewer comments, and any required actions."
    },
    {
      question: "What if my application is rejected?",
      answer: "If your application is rejected, you'll receive detailed feedback in the Application Tracking section. You can address the issues mentioned and resubmit your application. Common rejection reasons include incomplete documentation or missing required information."
    },
    {
      question: "How do I update my business information?",
      answer: "Go to Exporter Profile > Business Information tab. Click 'Edit Profile' to update your business details. Note that some changes may require re-verification of your profile."
    }
  ];

  const contactMethods = [
    {
      icon: <Phone size={24} />,
      title: "Phone Support",
      description: "Call our support team",
      contact: "+251-11-123-4567",
      hours: "Mon-Fri, 8:00 AM - 6:00 PM EAT"
    },
    {
      icon: <Mail size={24} />,
      title: "Email Support",
      description: "Send us an email",
      contact: "support@exporterportal.et",
      hours: "Response within 24 hours"
    },
    {
      icon: <MessageCircle size={24} />,
      title: "Live Chat",
      description: "Chat with our team",
      contact: "Available in portal",
      hours: "Mon-Fri, 9:00 AM - 5:00 PM EAT"
    }
  ];

  const resources = [
    {
      title: "Exporter Registration Guide",
      description: "Complete guide to the registration process",
      type: "PDF",
      size: "2.3 MB"
    },
    {
      title: "Required Documents Checklist",
      description: "Checklist of all required documents",
      type: "PDF",
      size: "1.1 MB"
    },
    {
      title: "Coffee Quality Standards",
      description: "Ethiopian coffee quality requirements",
      type: "PDF",
      size: "3.7 MB"
    },
    {
      title: "Export Process Flowchart",
      description: "Visual guide to the export process",
      type: "PDF",
      size: "1.8 MB"
    }
  ];

  const handleSubmitSupport = () => {
    // TODO: Implement support ticket submission
    console.log('Support ticket:', supportForm);
    setSubmitted(true);
    setSupportForm({ subject: '', category: '', message: '' });
  };

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Help & Support
        </Typography>

        <Grid container spacing={4}>
          {/* Contact Methods */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contact Support
                </Typography>
                {contactMethods.map((method, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {method.icon}
                      <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 600 }}>
                        {method.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {method.description}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {method.contact}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {method.hours}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>

            {/* Support Ticket Form */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Submit Support Ticket
                </Typography>
                
                {submitted && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Your support ticket has been submitted successfully. We'll respond within 24 hours.
                  </Alert>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Subject"
                      value={supportForm.subject}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Category"
                      value={supportForm.category}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, category: e.target.value }))}
                      SelectProps={{ native: true }}
                    >
                      <option value="">Select category</option>
                      <option value="registration">Registration Issues</option>
                      <option value="application">Application Status</option>
                      <option value="documents">Document Upload</option>
                      <option value="technical">Technical Issues</option>
                      <option value="other">Other</option>
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Message"
                      value={supportForm.message}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Please describe your issue in detail..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={handleSubmitSupport}
                      disabled={!supportForm.subject || !supportForm.message}
                      fullWidth
                    >
                      Submit Ticket
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* FAQ and Resources */}
          <Grid item xs={12} md={8}>
            {/* FAQ Section */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Frequently Asked Questions
                </Typography>
                {faqs.map((faq, index) => (
                  <Accordion key={index}>
                    <AccordionSummary expandIcon={<ChevronDown />}>
                      <Typography variant="subtitle1">{faq.question}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary">
                        {faq.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </CardContent>
            </Card>

            {/* Resources Section */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Helpful Resources
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Download guides and documentation to help you through the export process.
                </Typography>
                
                <List>
                  {resources.map((resource, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          <FileText size={24} />
                        </ListItemIcon>
                        <ListItemText
                          primary={resource.title}
                          secondary={resource.description}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={resource.type} size="small" />
                          <Typography variant="caption" color="text.secondary">
                            {resource.size}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<Download size={16} />}
                            onClick={() => console.log('Download:', resource.title)}
                          >
                            Download
                          </Button>
                        </Box>
                      </ListItem>
                      {index < resources.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Links
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<ExternalLink size={16} />}
                      onClick={() => window.open('https://ecta.gov.et', '_blank')}
                    >
                      ECTA Official Website
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<ExternalLink size={16} />}
                      onClick={() => window.open('https://eic.gov.et', '_blank')}
                    >
                      EIC Registration
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Clock size={16} />}
                    >
                      Service Hours
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<CheckCircle size={16} />}
                    >
                      System Status
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
};

export default HelpSupport;
