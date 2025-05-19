document.addEventListener('DOMContentLoaded', () => {
  // Once page elements are loaded, fetch then display all recipes
  loadInitialRecipes();

  // Get elements from index.html
  const btnNewRecipe = document.getElementById('btn-new-recipe');
  const btnCancel = document.getElementById('btn-cancel');
  const recipeOutput = document.getElementById('recipe-output');
  const newRecipeForm = document.getElementById('frm-new-recipe');
  const newRecipeDiv = document.getElementById('new-recipe');
  const ratingInput = document.getElementById('rating');
  const ratingDisplay = document.getElementById('new-rating-value');
  const prepInput = document.getElementById('prep_time');
  const prepDisplay = document.getElementById('new-prep-value');
  const cookInput = document.getElementById('cook_time');
  const cookDisplay = document.getElementById('new-cook-value');
  const divNewRecipe = document.getElementById('div-new-recipe');


  // rating, times display event listener
  ratingInput.addEventListener('input', () => {
    ratingDisplay.innerHTML= getStarRating(ratingInput.value);
  
  });
  prepInput.addEventListener('input', () => {
    prepDisplay.textContent = prepInput.value + ' minutes'
  });
  cookInput.addEventListener('input', () => {
    cookDisplay.textContent = cookInput.value + ' minutes'
  });

  // event listeners to see when new recipe clicked
  btnNewRecipe.addEventListener('click', () => {
    newRecipeDiv.style.display = 'block';
    recipeOutput.innerHTML = '';
    btnNewRecipe.style.display = 'none';
  });

  //Event listener for cancel add new
  btnCancel.addEventListener('click',(e) =>{
    e.preventDefault();
    if (confirm('Are you sure you want to discard changes?')) {
      newRecipeDiv.style.display = 'none';
      btnNewRecipe.style.display = 'block';
      newRecipeForm.reset();
      loadInitialRecipes();
    }
  });

  // Event listener for new recipe submission
  newRecipeForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // stop normal submit behaviour

    // get values from newRecipeForm
    const newRecipe = {
      name: document.getElementById('name').value,
      description: document.getElementById('description').value,
      ingredients: document.getElementById('ingredients').value,
      instructions: document.getElementById('instructions').value,
      prep_time: document.getElementById('prep_time').value,
      cook_time: document.getElementById('cook_time').value,
      cuisine_type: document.getElementById('cuisine_type').value,
      rating: document.getElementById('rating').value,
    };

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRecipe),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add recipe');
      }

      // clear form and hide
      newRecipeForm.reset();
      newRecipeForm.style.display = 'none';

      // show updated recipes
      const recipes = await fetchRecipes();
      showAllRecipes(recipes);
    } catch (error) {
      console.error('Error adding recipe:', error);
      showError(`Failed to add recipe: ${error.message}`);
    }
  });

  async function loadInitialRecipes() {
    try {
      const recipes = await fetchRecipes();
      showAllRecipes(recipes);
    } catch (error) {
      console.error('Error initialising list of recipes', error);
      showError('Unable to load recipes.  Please try again later.');
    }
  }

  async function fetchRecipes() {
    try {
      const response = await fetch('/api/recipes');
      if (!response.ok) {
        throw new Error('http response not okay!');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching recipes from db', error);
      if (error.name === 'TypeError') {
        showError('Network error. Please check your connection.');
      } else {
        showError('Unable to fetch recipes. Server may be unavailable.');
      }
      return [];
    }
  }

  function showAllRecipes(recipes) {
    divNewRecipe.style.display='block';
    if (!recipes || recipes.length === 0) {
      recipeOutput.innerHTML = '<p>No recipes found<p>';
      return;
    }

    const table = `
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Cuisine</th>
                        <th>Rating</th>
                    </tr>
                </thead>
                <tbody>
                    ${recipes
                      .map(
                        (recipe) => `
                        <tr class='recipe-row' data-id='${recipe.id}'>
                            <td>${recipe.name || 'n/a'}</td>
                            <td>${recipe.description || 'n/a'}</td>
                            <td>${recipe.cuisine_type || 'n/a'}</td>
                            <td>${recipe.rating || 'n/a'}</td>
                        </tr>
                    `
                      )
                      .join('')}
                </tbody>
                </table>
                `;

    recipeOutput.innerHTML = table;

    // Event listener for click on row in table
    document.querySelectorAll('.recipe-row').forEach((row) => {
      row.addEventListener('click', () => {
        divNewRecipe.style.display='none';

        showRecipeDetail(row.dataset.id);})
    });
  }

  async function showRecipeDetail(recipeId) {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recipe details');
      }
      const recipe = await response.json();

      const detailView = `
            <div class="recipe-detail">
                <h2>${recipe.name}</h2>
                <p><strong>Description:</strong> ${
                  recipe.description || 'No description available'
                }</p>
                    <p><strong>Cuisine Type:</strong> ${
                      recipe.cuisine_type || 'Not specified'
                    }</p>
                    <p><strong>Rating:</strong> ${'⭐'.repeat(
                      recipe.rating
                    )}</p>
                    <div class="times">
                        <p><strong>Prep Time:</strong> ${recipe.prep_time}</p>
                        <p><strong>Cook Time:</strong> ${recipe.cook_time}</p>
                    </div>
                    <div class="ingredients">
                        <h3>Ingredients:</h3>
                        <pre>${recipe.ingredients}</pre>
                    </div>
                    <div class="instructions">
                        <h3>Instructions:</h3>
                        <pre>${recipe.instructions}</pre>
                    </div>
                    <div class="button-group">
                      <button class="back-button">← Back to All Recipes</button>
                      <button class="edit-button" data-id="${
                        recipe.id
                      }">✏️ Edit</button>
                      <button class="delete-button" data-id="${
                        recipe.id
                      }">🗑️ Delete</button>
                    </div>
                    
            </div>
          
        `;

      recipeOutput.innerHTML = detailView;
      // Add event listener to back-button added inside recipe-detail view above
      document
        .querySelector('.back-button')
        .addEventListener('click', async () => {
          const recipes = await fetchRecipes();
          showAllRecipes(recipes);
        });
      // Add event listener for delete and edit buttons
      document
        .querySelector('.delete-button')
        .addEventListener('click', async () => {
          if (confirm('Are you sure you want to delete this recipe?')) {
            await deleteRecipe(recipeId);
          }
        });

      document.querySelector('.edit-button').addEventListener('click', () => {
        showEditForm(recipe);
      });
    } catch {
      console.error('Error fetching recipe details:', error);
      showError('Unable to load recipe details');
    }
  }

  async function deleteRecipe(recipeId) {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }
      const recipes = await fetchRecipes();
      showAllRecipes(recipes);
    } catch (error) {
      showError('Failed to delete recipe');
    }
  }

  function showEditForm(recipe) {
    const editView = `
    <div class="recipe-detail">
      <form id="edit-recipe-form" data-id="${recipe.id}">
        <div class="form-group">
          <label for="edit-name">Name:</label>
          <input type="text" id="edit-name" value="${recipe.name}" required>
        </div>
        <div class="form-group">
          <label for="edit-description">Description:</label>
          <input type="text" id="edit-description" value="${
            recipe.description || ''
          }">
        </div>
        <div class="form-group">
            <label for="edit-cuisine">Cuisine Type:</label>
            <input type="text" id="edit-cuisine" value="${
              recipe.cuisine_type || ''
            }">
        </div>
        <div class="form-group">
            <label for="edit-rating">Rating:</label>
            <input type="range" id="edit-rating" min="0" max="5" value="${
              recipe.rating || 0
            }">
            <span id="rating-value">${recipe.rating || 0}</span>
        </div>
        <div class="form-group">
            <label for="edit-prep-time">Prep Time (minutes):</label>
            <input type="number" id="edit-prep-time" value="${
              recipe.prep_time || 0
            }">
        </div>
        <div class="form-group">
            <label for="edit-cook-time">Cook Time (minutes):</label>
            <input type="number" id="edit-cook-time" value="${
              recipe.cook_time || 0
            }">
        </div>
        <div class="form-group">
            <label for="edit-ingredients">Ingredients:</label>
            <textarea id="edit-ingredients" rows="10">${
              recipe.ingredients || ''
            }</textarea>
        </div>
        <div class="form-group">
            <label for="edit-instructions">Instructions:</label>
            <textarea id="edit-instructions" rows="10">${
              recipe.instructions || ''
            }</textarea>
        </div>
        <div class="button-group">
            <button type="submit" class="save-button">💾 Save Changes</button>
            <button type="button" class="cancel-button">❌ Cancel</button>
        </div>
      </form>
    </div>
  `;

    recipeOutput.innerHTML = editView;
    

    // Event listeners for form
    const editForm = document.getElementById('edit-recipe-form');
    const ratingInput = document.getElementById('edit-rating');
    const ratingDisplay = document.getElementById('rating-value');

    // show inital star rating
    ratingDisplay.innerHTML = getStarRating(ratingInput.value);

    // Change rating display on slider move
    ratingInput.addEventListener('input', () => {
      ratingDisplay.innerHTML = getStarRating(ratingInput.value);
    });

    // Form submission
    editForm.addEventListener('submit', async (e) =>{
      e.preventDefault();
      const updatedRecipe = {
        name: document.getElementById('edit-name').value,
        description: document.getElementById('edit-description').value,
        cuisine_type: document.getElementById('edit-cuisine').value,
        rating: document.getElementById('edit-rating').value,
        prep_time: document.getElementById('edit-prep-time').value,
        cook_time: document.getElementById('edit-cook-time').value,
        ingredients: document.getElementById('edit-ingredients').value,
        instructions: document.getElementById('edit-instructions').value
      };

      try {
        const response = await fetch(`/api/recipes/${recipe.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedRecipe)
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Server error:', errorData);
          throw new Error('Failed to update recipe');
        }
        showRecipeDetail(recipe.id);
      }
      catch (error) {
        showError(error.message);
        console.error('Update error:', error);
      }
    });

    // Handle cancel button
    document.querySelector('.cancel-button').addEventListener('click', () => {
      if(confirm('Are you sure you want to discard changes?')) {
        showRecipeDetail(recipe.id);
      };
      
    });
  }

  function getStarRating (starValue) {
    const filledStars = '⭐'.repeat(starValue);
    const emptyStars = '<span class="empty-star">☆</span>'.repeat(5 - starValue);
    return filledStars + emptyStars
  }

  function showError(message) {
    recipeOutput.innerHTML = `
        <div class="error-message">
            <p>⚠️ ${message}</p>
        </div>
    `;
  }
});
