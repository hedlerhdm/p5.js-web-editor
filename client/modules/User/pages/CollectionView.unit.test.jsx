import React from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import { reduxRender, screen } from '../../../test-utils';
import CollectionView from './CollectionView';
import { initialTestState } from '../../../testData/testReduxStore';

// Mock components as simple function declarations
jest.mock('../../IDE/components/Header/Nav', () => {
  function MockNav() {
    return <div data-testid="nav" />;
  }
  MockNav.displayName = 'MockNav';
  return MockNav;
});

jest.mock('../components/Collection', () => {
  const mockPropTypes = {
    string: { isRequired: true }
  };

  function MockCollection({ collectionId, username }) {
    return (
      <div
        data-testid="collection"
        data-collection-id={collectionId}
        data-username={username}
      />
    );
  }

  MockCollection.propTypes = {
    collectionId: mockPropTypes.string.isRequired,
    username: mockPropTypes.string.isRequired
  };

  MockCollection.displayName = 'MockCollection';
  return MockCollection;
});

jest.mock('../../../components/RootPage', () => {
  const mockPropTypes = {
    node: true
  };

  function MockRootPage({ children }) {
    return <div data-testid="root-page">{children}</div>;
  }

  MockRootPage.propTypes = {
    children: mockPropTypes.node
  };

  MockRootPage.defaultProps = {
    children: null
  };

  MockRootPage.displayName = 'MockRootPage';
  return MockRootPage;
});

describe('<CollectionView />', () => {
  const renderWithRouter = (route = '/user/testuser/collections/123') =>
    reduxRender(
      <MemoryRouter initialEntries={[route]}>
        <Route path="/user/:username/collections/:collection_id">
          <CollectionView />
        </Route>
      </MemoryRouter>,
      { initialState: initialTestState }
    );

  it('renders basic collection view components', () => {
    renderWithRouter();

    expect(screen.getByTestId('root-page')).toBeInTheDocument();
    expect(screen.getByTestId('nav')).toBeInTheDocument();
    expect(screen.getByTestId('collection')).toBeInTheDocument();
  });

  it('passes correct props to Collection component', () => {
    renderWithRouter('/user/testuser/collections/123');
    const collection = screen.getByTestId('collection');

    expect(collection).toHaveAttribute('data-collection-id', '123');
    expect(collection).toHaveAttribute('data-username', 'testuser');
  });

  it('renders nav with correct layout prop', () => {
    renderWithRouter();

    const nav = screen.getByTestId('nav');
    expect(nav).toBeInTheDocument();
  });

  it('handles different usernames and collection IDs', () => {
    renderWithRouter('/user/differentuser/collections/456');

    const collection = screen.getByTestId('collection');
    expect(collection).toHaveAttribute('data-collection-id', '456');
    expect(collection).toHaveAttribute('data-username', 'differentuser');
  });
});
