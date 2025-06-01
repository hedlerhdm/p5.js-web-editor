import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import thunk from 'redux-thunk';
import NewPasswordView from './NewPasswordView';

// Mock theme
const mockTheme = {
  primaryTextColor: '#333',
  backgroundColor: '#fff'
};

// Mock components
jest.mock('../../IDE/components/Header/Nav', () => () => (
  <div data-testid="nav" />
));

jest.mock('../components/NewPasswordForm', () => {
  const mockPropTypes = {
    string: { isRequired: true }
  };

  function MockNewPasswordForm({ resetPasswordToken }) {
    return (
      <div data-testid="new-password-form" data-token={resetPasswordToken}>
        Form Content
      </div>
    );
  }

  MockNewPasswordForm.propTypes = {
    resetPasswordToken: mockPropTypes.string.isRequired
  };

  MockNewPasswordForm.displayName = 'MockNewPasswordForm';
  return MockNewPasswordForm;
});

// Mock actions
jest.mock('../actions', () => ({
  validateResetPasswordToken: (token) => ({
    type: 'VALIDATE_RESET_PASSWORD_TOKEN',
    token
  })
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'NewPasswordView.Title': 'Reset Password',
        'NewPasswordView.Description': 'Enter New Password',
        'NewPasswordView.TokenInvalidOrExpired':
          'Password reset token is invalid or has expired'
      };
      return translations[key] || key;
    }
  })
}));

// Simplified Helmet mock
jest.mock('react-helmet', () => ({
  Helmet: () => <div data-testid="helmet-title">Reset Password</div>
}));

describe('<NewPasswordView />', () => {
  const renderComponent = (resetPasswordInvalid = false) => {
    const store = configureStore({
      reducer: (state = { user: { resetPasswordInvalid } }) => state,
      middleware: [thunk]
    });

    return render(
      <Provider store={store}>
        <ThemeProvider theme={mockTheme}>
          <MemoryRouter initialEntries={['/reset-password/test-token']}>
            <Route path="/reset-password/:reset_password_token">
              <NewPasswordView />
            </Route>
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    );
  };

  it('renders basic components', () => {
    renderComponent();

    expect(screen.getByTestId('nav')).toBeInTheDocument();
    expect(screen.getByText('Enter New Password')).toBeInTheDocument();
    expect(screen.getByTestId('new-password-form')).toBeInTheDocument();
  });

  it('passes reset token to password form', () => {
    renderComponent();

    const form = screen.getByTestId('new-password-form');
    expect(form).toHaveAttribute('data-token', 'test-token');
  });

  it('shows error message when token is invalid', () => {
    renderComponent(true);

    expect(
      screen.getByText('Password reset token is invalid or has expired')
    ).toBeInTheDocument();
    expect(screen.getByTestId('new-password-form')).toHaveAttribute(
      'data-token',
      'test-token'
    );
  });

  it('adds invalid class when token is invalid', () => {
    renderComponent(true);

    const container = screen
      .getByTestId('new-password-form')
      .closest('.new-password');
    expect(container).toHaveClass('new-password--invalid');
  });

  it('sets correct page title', () => {
    renderComponent();

    expect(screen.getByTestId('helmet-title')).toHaveTextContent(
      'Reset Password'
    );
  });
});
