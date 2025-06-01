import React from 'react';
import { useParams } from 'react-router-dom';
import Collection from '../components/Collection';
import Nav from '../../IDE/components/Header/Nav';
import RootPage from '../../../components/RootPage';

function CollectionView() {
  const { username, collection_id: collectionId } = useParams();

  return (
    <RootPage>
      <Nav />
      <Collection username={username} collectionId={collectionId} />
    </RootPage>
  );
}

export default CollectionView;
