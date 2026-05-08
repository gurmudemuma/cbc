import React from 'react';
import { Box } from '@mui/material';
import SalesContractVerification from '../components/SalesContractVerification';
import { CommonPageProps } from '../types';

interface SalesContractVerificationPageProps extends CommonPageProps {}

const SalesContractVerificationPage = ({ user, org }: SalesContractVerificationPageProps): JSX.Element => {
  return (
    <Box sx={{ p: 3 }}>
      <SalesContractVerification />
    </Box>
  );
};

export default SalesContractVerificationPage;
