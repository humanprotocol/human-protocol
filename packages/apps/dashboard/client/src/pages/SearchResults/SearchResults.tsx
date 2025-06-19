import SearchResults from '@/features/searchResults';
import Breadcrumbs from '@/shared/ui/Breadcrumbs';
import SearchBar from '@/shared/ui/SearchBar';
import PageWrapper from '@/widgets/page-wrapper';

const SearchResultsPage = () => {
  return (
    <PageWrapper className="standard-background">
      <Breadcrumbs title="Search Results" />
      <SearchBar />
      <SearchResults />
    </PageWrapper>
  );
};

export default SearchResultsPage;
