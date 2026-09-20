import express from "express";
import { authorizeModification } from "../middleware/authorize.js";
import { authenticate } from "../middleware/authenticate.js";
import {
  addMovie,
  deleteMovie,
  findById,
  getWatchlist,
  updateMovie,
} from "../utils/db.js";

const router = express.Router();

router.get("/:userId", authenticate, (req, res) => {
  const { userId } = req.params;

  const watchlist = getWatchlist(userId);
  const user = findById(userId);

  if (!user) {
    return res.status(404).json({
      error: "Doesn't exist"
    });
  }

  return res.status(200).json({
    watchlist
  });
});

router.post(
  "/:userId/movies",
  authenticate,
  authorizeModification,
  (req, res) => {
    const { userId } = req.params;
    const movieData = req.body;
    const title = movieData?.title?.trim();

    if (!movieData.title) {
      return res.status(400).json({
        error: "Bad request",
      });
    }

    const watchlist = getWatchlist(userId);

    if (!watchlist) {
      return res.status(404).json({ error: "User not found"})
    }

    const movieExists = watchlist.some((movie) => movie.title?.trim().toLowerCase() === title.toLowerCase()) 
    
    if (movieExists) {
      return res.status(409).json({ error: "Movie already exists"})
    }
    
    const movie = addMovie(userId, {...movieData, title});

    if (!movie) {
      return res.status(404).json({ error: "User not found" });
    }
    
    return res.status(201).json({
      message: `Successfully added movie`,
      movie,
    });
  },
);

router
  .route("/:userId/movies/:movieId")
  .put(authenticate, authorizeModification, (req, res) => {
    const { userId, movieId } = req.params;
    const updates = req.body

    const user = findById(userId)
    
    if (!user) {
        return res.status(404).json({
            error: "User not found"
        })
    }

    const movie = updateMovie(userId, movieId, updates)

    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    return res.status(200).json({
        message: "Successfully updated movie",
        movie,
    })
    
  })
  .delete(authenticate, authorizeModification, (req, res) => {
    const { userId, movieId} = req.params;

    const user = findById(userId)
    
    if (!user) {
        return res.status(404).json({
            error: "User not found"
        })
    }

    const deleted = deleteMovie(userId, movieId)

    if (!deleted) {
      return res.status(404).json({ error: "Movie not found" });
    }

    return res.status(200).json({
        message: "Successfully deleted movie"
    })
  });

  export default router
