import { useState } from 'react';
import { Card, CardHeader, CardContent, CardActions, Button, TextField } from '@mui/material';
import { Send } from 'lucide-react';

const SalesContractNegotiationForm = ({ draft, onAccept, onReject, onCounterOffer }) => {
  const [message, setMessage] = useState('');
  
  return (
    <Card>
      <CardHeader title="Contract Negotiation" />
      <CardContent>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </CardContent>
      <CardActions>
        <Button onClick={() => onAccept && onAccept()}>Accept</Button>
        <Button onClick={() => onReject && onReject()}>Reject</Button>
        <Button onClick={() => onCounterOffer && onCounterOffer(message)} startIcon={<Send />}>Counter Offer</Button>
      </CardActions>
    </Card>
  );
};

export default SalesContractNegotiationForm;
