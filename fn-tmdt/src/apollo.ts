import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: `${import.meta.env.VITE_API_URL || ''}/graphql`, // Sử dụng biến môi trường
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('access_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  }
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});
