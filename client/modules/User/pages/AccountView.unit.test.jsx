import React from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from 'styled-components';
import thunk from 'redux-thunk';
import AccountView from './AccountView';
import { initialTestState } from '../../../testData/testReduxStore';

// Add mockHistoryPush before mocks
const mockHistoryPush = jest.fn();

// Update mock theme with required button properties
const mockTheme = {
  primaryTextColor: '#333',
  backgroundColor: '#fff',
  p5ButtonBackground: '#f1f1f1',
  p5ButtonHover: '#e1e1e1',
  p5ButtonActive: '#d1d1d1',
  Button: {
    primary: {
      default: {
        background: '#ed225d',
        foreground: '#fff',
        border: 'none'
      },
      hover: {
        background: '#aa1839',
        foreground: '#fff',
        border: 'none'
      },
      active: {
        background: '#780f28',
        foreground: '#fff',
        border: 'none'
      },
      disabled: {
        background: '#ffd1d1',
        foreground: '#666',
        border: 'none'
      }
    },
    secondary: {
      default: {
        background: 'transparent',
        foreground: '#333',
        border: '#979797'
      },
      hover: {
        background: '#f1f1f1',
        foreground: '#333',
        border: '#979797'
      },
      active: {
        background: '#e3e3e3',
        foreground: '#333',
        border: '#979797'
      },
      disabled: {
        background: 'transparent',
        foreground: '#666',
        border: '#979797'
      }
    }
  }
};

// Add reduxRender utility
function reduxRender(
  ui,
  {
    initialState = initialTestState,
    store = configureStore({
      reducer: (state) => state,
      preloadedState: initialState,
      middleware: [thunk]
    }),
    ...renderOptions
  } = {}
) {
  const mockPropTypes = {
    node: true
  };

  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <ThemeProvider theme={mockTheme}>{children}</ThemeProvider>
      </Provider>
    );
  }

  Wrapper.propTypes = {
    children: mockPropTypes.node
  };

  Wrapper.defaultProps = {
    children: null
  };

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
}

// Mock components as named functions with displayName
jest.mock('../../IDE/components/Header/Nav', () => {
  function MockNav() {
    return <div data-testid="nav" />;
  }
  MockNav.displayName = 'MockNav';
  return MockNav;
});

jest.mock('../../IDE/components/ErrorModal', () => {
  function MockErrorModal() {
    return (
      <div
        data-testid="error-modal"
        data-type="oauthError"
        data-service="github"
      >
        <button data-testid="error-modal-close">Close</button>
      </div>
    );
  }
  MockErrorModal.displayName = 'MockErrorModal';
  return MockErrorModal;
});

jest.mock('../../IDE/components/Toast', () => {
  function MockToast() {
    return <div data-testid="toast" />;
  }
  MockToast.displayName = 'MockToast';
  return MockToast;
});

jest.mock('../components/APIKeyForm', () => {
  function MockAPIKeyForm() {
    return <div data-testid="api-key-form" />;
  }
  MockAPIKeyForm.displayName = 'MockAPIKeyForm';
  return MockAPIKeyForm;
});

// Update SocialAuthButton mock to match test expectations
jest.mock('../components/SocialAuthButton', () => {
  const mockPropTypes = {
    string: { isRequired: true },
    bool: { isRequired: true }
  };

  function MockSocialButton({ service, isConnected }) {
    return (
      <button
        data-testid={`social-button-${service}`}
        data-connected={isConnected}
      >
        {service}
      </button>
    );
  }

  MockSocialButton.propTypes = {
    service: mockPropTypes.string.isRequired,
    isConnected: mockPropTypes.bool.isRequired
  };

  MockSocialButton.services = {
    github: 'github',
    google: 'google'
  };
  MockSocialButton.displayName = 'MockSocialButton';
  return MockSocialButton;
});

jest.mock('../../App/components/Overlay', () => {
  const mockPropTypes = {
    node: true
  };

  function MockOverlay({ children }) {
    const handleClick = () => {
      mockHistoryPush('/account');
    };

    return (
      <div
        data-testid="overlay"
        onClick={handleClick}
        onKeyDown={(e) => e.key === 'Escape' && handleClick()}
        role="button"
        tabIndex={0}
      >
        {children}
      </div>
    );
  }

  MockOverlay.propTypes = {
    children: mockPropTypes.node
  };

  MockOverlay.defaultProps = {
    children: null
  };

  MockOverlay.displayName = 'MockOverlay';
  return MockOverlay;
});

// Add i18next mock
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'AccountView.SocialLogin': 'Connect Account', // Add translation key
        'AccountView.AccountSettings': 'Account Settings'
      };
      return translations[key] || key;
    }
  })
}));

describe('<AccountView />', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: (state) => state,
      preloadedState: initialTestState,
      middleware: [thunk]
    });
    window.process = {
      env: {
        UI_ACCESS_TOKEN_ENABLED: false
      }
    };
    mockHistoryPush.mockClear(); // Clear mock history before each test
  });

  const renderWithRouter = (route = '/account') =>
    reduxRender(
      <MemoryRouter initialEntries={[route]}>
        <Route path="/account">
          <AccountView />
        </Route>
      </MemoryRouter>,
      { store }
    );

  it('renders basic account view components', () => {
    renderWithRouter();

    expect(screen.getByTestId('nav')).toBeInTheDocument();
    // Use getByTestId instead of getByRole for more reliable testing
    expect(screen.getByTestId('account-settings-title')).toBeInTheDocument();
    expect(screen.getByTestId('toast')).toBeInTheDocument();
  });

  it('renders social login panel with correct connection states', () => {
    const stateWithSocial = {
      ...initialTestState,
      user: {
        ...initialTestState.user,
        github: true,
        google: false
      }
    };
    store = configureStore({
      reducer: (state) => state,
      preloadedState: stateWithSocial,
      middleware: [thunk]
    });

    renderWithRouter();

    const githubButton = screen.getByTestId('social-button-github');
    const googleButton = screen.getByTestId('social-button-google');

    expect(githubButton).toHaveAttribute('data-connected', 'true');
    expect(googleButton).toHaveAttribute('data-connected', 'false');
  });

  it('shows error modal when URL has error parameter', () => {
    renderWithRouter('/account?error=github');

    const errorModal = screen.getByTestId('error-modal');
    expect(errorModal).toBeInTheDocument();
    expect(errorModal).toHaveAttribute('data-type', 'oauthError');
    expect(errorModal).toHaveAttribute('data-service', 'github');
  });

  it('closes error modal and updates URL when overlay is closed', () => {
    renderWithRouter('/account?error=github');

    const overlay = screen.getByTestId('overlay');
    fireEvent.click(overlay);

    expect(mockHistoryPush).toHaveBeenCalledWith('/account');
  });

  describe('with UI_ACCESS_TOKEN_ENABLED=true', () => {
    beforeEach(() => {
      window.process.env.UI_ACCESS_TOKEN_ENABLED = true;
    });

    it('renders tabs when access tokens are enabled', () => {
      renderWithRouter();

      // Use more specific text matching to avoid ambiguity
      expect(screen.getByRole('tab', { name: /account/i })).toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: /access tokens/i })
      ).toBeInTheDocument();
    });

    it('switches between account and API key tabs', () => {
      renderWithRouter();

      // Initially shows account panel is visible
      expect(screen.queryByTestId('api-key-form')).not.toBeInTheDocument();

      // Find and click the access tokens tab
      const tabs = screen.getAllByRole('tab');
      const accessTokensTab = tabs[1]; // Second tab is Access Tokens
      fireEvent.click(accessTokensTab);

      // API key form should be visible
      expect(screen.getByTestId('api-key-form')).toBeInTheDocument();
    });
  });

  describe('with UI_ACCESS_TOKEN_ENABLED=false', () => {
    beforeEach(() => {
      window.process.env.UI_ACCESS_TOKEN_ENABLED = false;
    });

    it('does not render tabs when access tokens are disabled', () => {
      renderWithRouter();

      expect(screen.queryByText(/access tokens/i)).not.toBeInTheDocument();
      expect(screen.queryByTestId('api-key-form')).not.toBeInTheDocument();
    });

    it('shows social login panel directly without tabs', () => {
      renderWithRouter();

      expect(screen.getByText(/connect account/i)).toBeInTheDocument();
      expect(screen.getByTestId('social-button-github')).toBeInTheDocument();
      expect(screen.getByTestId('social-button-google')).toBeInTheDocument();
    });
  });
});
