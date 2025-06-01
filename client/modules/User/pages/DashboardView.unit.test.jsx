import React from 'react';
import PropTypes from 'prop-types';
import { MemoryRouter, Route } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from 'styled-components';
import thunk from 'redux-thunk';
import DashboardView from './DashboardView';
import { initialTestState } from '../../../testData/testReduxStore';
import * as projectActions from '../../IDE/actions/project';
import useIsMobile from '../../IDE/hooks/useIsMobile';

// Add mock theme at the top
const mockTheme = {
  primaryTextColor: '#333',
  backgroundColor: '#fff',
  p5ButtonBackground: '#f1f1f1',
  p5ButtonHover: '#e1e1e1',
  p5ButtonActive: '#d1d1d1'
};

// Update reduxRender utility
function reduxRender(ui, options = {}) {
  const {
    initialState = initialTestState,
    store = configureStore({
      reducer: (state) => state,
      preloadedState: initialState,
      middleware: [thunk]
    }),
    ...renderOptions
  } = options;

  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <ThemeProvider theme={mockTheme}>{children}</ThemeProvider>
    </Provider>
  );

  Wrapper.propTypes = {
    children: PropTypes.node.isRequired
  };

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
}

// Add i18next mock
jest.mock('i18next', () => ({
  use: () => ({
    init: () => {}
  }),
  t: (key) => key
}));

// Add react-i18next mock
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'DashboardView.NewSketch': 'New Sketch',
        'DashboardView.CreateCollection': 'Create Collection',
        'DashboardView.CreateCollectionOverlay': 'Create Collection'
      };
      return translations[key] || key;
    }
  })
}));

// Mock components
jest.mock('../../IDE/components/Header/Nav', () => () => (
  <div data-testid="nav" />
));

// Update mocked components with PropTypes
const Button = ({ children, onClick }) => (
  <button type="button" onClick={onClick}>
    {children}
  </button>
);

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired
};

jest.mock('../../../common/Button', () => Button);

jest.mock('../../IDE/components/Searchbar', () => ({
  CollectionSearchbar: () => <div data-testid="collection-search" />,
  SketchSearchbar: () => <div data-testid="sketch-search" />
}));

jest.mock('../../IDE/components/AssetSize', () => () => (
  <div data-testid="asset-size" />
));

const TabSwitcher = ({ currentTab }) => (
  <div data-testid="tab-switcher" data-current-tab={currentTab} />
);

TabSwitcher.propTypes = {
  currentTab: PropTypes.string.isRequired
};

jest.mock('../components/DashboardTabSwitcher', () => ({
  __esModule: true,
  default: TabSwitcher,
  TabKey: {
    sketches: 'sketches',
    collections: 'collections',
    assets: 'assets'
  }
}));

// Remove isMobile variable and update useIsMobile mock
jest.mock('../../IDE/hooks/useIsMobile', () => ({
  __esModule: true,
  default: jest.fn(() => false)
}));

// Update component mocks with PropTypes
const AssetList = ({ username, mobile }) => (
  <div
    data-testid="asset-list"
    data-username={username}
    data-mobile={String(mobile)}
  />
);

AssetList.propTypes = {
  username: PropTypes.string.isRequired,
  mobile: PropTypes.bool.isRequired
};

jest.mock('../../IDE/components/AssetList', () => AssetList);

const CollectionList = ({ username, mobile }) => (
  <div
    data-testid="collection-list"
    data-username={username}
    data-mobile={String(mobile)}
  />
);

CollectionList.propTypes = {
  username: PropTypes.string.isRequired,
  mobile: PropTypes.bool.isRequired
};

jest.mock('../../IDE/components/CollectionList', () => CollectionList);

const SketchList = ({ username, mobile }) => (
  <div
    data-testid="sketch-list"
    data-username={username}
    data-mobile={String(mobile)}
  />
);

SketchList.propTypes = {
  username: PropTypes.string.isRequired,
  mobile: PropTypes.bool.isRequired
};

jest.mock('../../IDE/components/SketchList', () => SketchList);

jest.mock('../components/CollectionCreate', () => () => (
  <div data-testid="collection-create" />
));

const Overlay = ({ children, closeOverlay }) => (
  <div
    data-testid="overlay"
    onClick={closeOverlay}
    onKeyDown={(e) => e.key === 'Escape' && closeOverlay()}
    role="button"
    tabIndex={0}
  >
    {children}
  </div>
);

Overlay.propTypes = {
  children: PropTypes.node.isRequired,
  closeOverlay: PropTypes.func.isRequired
};

jest.mock('../../App/components/Overlay', () => Overlay);

// Mock actions
jest
  .spyOn(projectActions, 'newProject')
  .mockImplementation(() => ({ type: 'NEW_PROJECT' }));

describe('<DashboardView />', () => {
  const mockState = {
    ...initialTestState,
    user: {
      ...initialTestState.user,
      username: 'testuser'
    }
  };

  const renderWithRouter = (route = '/user/testuser/sketches') =>
    reduxRender(
      <MemoryRouter initialEntries={[route]}>
        <Route path="/user/:username/:tab?">
          <DashboardView />
        </Route>
      </MemoryRouter>,
      { initialState: mockState }
    );

  it('renders basic dashboard components', () => {
    renderWithRouter();

    expect(screen.getByTestId('nav')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByTestId('sketch-list')).toBeInTheDocument();
  });

  it('shows correct content for sketches tab', () => {
    renderWithRouter('/user/testuser/sketches');

    expect(screen.getByTestId('sketch-list')).toBeInTheDocument();
    expect(screen.getByText(/new sketch/i)).toBeInTheDocument();
  });

  it('shows correct content for collections tab', () => {
    renderWithRouter('/user/testuser/collections');

    expect(screen.getByTestId('collection-list')).toBeInTheDocument();
    expect(screen.getByText(/create collection/i)).toBeInTheDocument();
  });

  it('shows correct content for assets tab', () => {
    renderWithRouter('/user/testuser/assets');

    expect(screen.getByTestId('asset-list')).toBeInTheDocument();
  });

  it('handles new sketch creation', () => {
    renderWithRouter('/user/testuser/sketches');

    const newSketchButton = screen.getByText(/new sketch/i);
    fireEvent.click(newSketchButton);

    expect(projectActions.newProject).toHaveBeenCalled();
  });

  it('toggles collection create overlay', () => {
    renderWithRouter('/user/testuser/collections');

    const createCollectionButton = screen.getByText(/create collection/i);
    fireEvent.click(createCollectionButton);

    expect(screen.getByTestId('collection-create')).toBeInTheDocument();

    const overlay = screen.getByTestId('overlay');
    fireEvent.click(overlay);

    expect(screen.queryByTestId('collection-create')).not.toBeInTheDocument();
  });

  it('hides action buttons for non-owner users', () => {
    renderWithRouter('/user/otheruser/sketches');

    expect(screen.queryByText(/new sketch/i)).not.toBeInTheDocument();
  });

  describe('mobile view', () => {
    beforeEach(() => {
      // Update mock implementation without require
      useIsMobile.mockImplementation(() => true);

      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: true,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }));
    });

    afterEach(() => {
      // Reset mock implementation without require
      useIsMobile.mockImplementation(() => false);
    });

    it('passes mobile prop to content components', () => {
      renderWithRouter();
      expect(screen.getByTestId('sketch-list')).toHaveAttribute(
        'data-mobile',
        'true'
      );
    });
  });

  describe('tab switching', () => {
    it('shows sketch tab content by default', () => {
      renderWithRouter();

      expect(screen.getByTestId('tab-switcher')).toHaveAttribute(
        'data-current-tab',
        'sketches'
      );
      expect(screen.getByTestId('sketch-list')).toBeInTheDocument();
      expect(screen.getByTestId('sketch-search')).toBeInTheDocument();
    });

    it('shows collections tab content', () => {
      renderWithRouter('/user/testuser/collections');

      expect(screen.getByTestId('tab-switcher')).toHaveAttribute(
        'data-current-tab',
        'collections'
      );
      expect(screen.getByTestId('collection-list')).toBeInTheDocument();
      expect(screen.getByTestId('collection-search')).toBeInTheDocument();
    });

    it('shows assets tab content', () => {
      renderWithRouter('/user/testuser/assets');

      expect(screen.getByTestId('tab-switcher')).toHaveAttribute(
        'data-current-tab',
        'assets'
      );
      expect(screen.getByTestId('asset-list')).toBeInTheDocument();
    });
  });
});
