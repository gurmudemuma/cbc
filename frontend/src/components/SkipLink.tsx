import { styled } from '@mui/material/styles';

const SkipLinkStyled = styled('a')(({ theme }) => ({
  position: 'absolute',
  top: -40,
  left: 0,
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: '8px 16px',
  textDecoration: 'none',
  borderRadius: '0 0 4px 0',
  zIndex: 10000,
  fontWeight: 600,
  '&:focus': {
    top: 0,
    outline: '2px solid',
    outlineColor: theme.palette.primary.dark,
    outlineOffset: 2,
  },
}));

const SkipLink = () => {
  return (
    <SkipLinkStyled href="#main-content">
      Skip to main content
    </SkipLinkStyled>
  );
};

export default SkipLink;
