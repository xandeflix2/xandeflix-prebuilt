import React from 'react';
import { CatalogBrowsePage, type CatalogBrowsePageProps } from './CatalogBrowsePage.tsx';

export const MoviesPage: React.FC<CatalogBrowsePageProps> = props => <CatalogBrowsePage {...props} kind="movies"/>;
