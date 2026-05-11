import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import api from '../config/api';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const favoritesRef = useRef(favorites);

  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  useEffect(() => {
    if (!user?.user_id) {
      setFavorites([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/user/favorites');
        if (!cancelled) setFavorites(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) console.warn('Failed to load favorites');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.user_id]);

  const toggleFavorite = useCallback(async (showObject) => {
    if (!user?.user_id) return;
    const showId = showObject?.show_id;
    if (showId == null) return;

    const prev = favoritesRef.current;
    const isAlreadyFav = prev.some((fav) => String(fav.show_id) === String(showId));

    try {
      if (isAlreadyFav) {
        await api.delete(`/user/favorites/${showId}`);
        setFavorites((p) =>
          p.filter((fav) => String(fav.show_id) !== String(showId)),
        );
      } else {
        await api.post('/user/favorites', { showId });
        setFavorites((p) => {
          if (p.some((fav) => String(fav.show_id) === String(showId))) return p;
          return [...p, showObject];
        });
      }
    } catch (e) {
      console.warn('Favorite toggle failed', e?.message);
    }
  }, [user?.user_id]);

  const isFavorite = (showId) => {
    return favorites.some((fav) => String(fav.show_id) === String(showId));
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
