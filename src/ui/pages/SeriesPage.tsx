import React from 'react';
import { CatalogBrowsePage, type CatalogBrowsePageProps } from './CatalogBrowsePage.tsx';

export const SeriesPage: React.FC<CatalogBrowsePageProps> = props => <CatalogBrowsePage {...props} kind="series"/>;
