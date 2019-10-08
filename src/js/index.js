// Global app controller
import Search from "./models/Search";
import * as searchView from './views/searchView';   
import * as recipeView from './views/recipeView';   
import * as listView from './views/listView';   
import * as likesView from './views/likesView';   
import  List from "./models/List";
import  Like from "./models/Likes";
import {elements, renderLoader, clearLoader} from "./views/base";
import Recipe from './models/Recipe'
import Likes from "./models/Likes";

/** Global state of the app
  *  - Search object
  *  - Current recipe object
  *  - Shopping list object 
  *  - Liked recipes*/
const state ={};

/* SEARCH CONTROLLER

*/
const controlSearch = async () =>{
    // 1. get query from the view
    const query =searchView.getInput();

    if(query){
        // 2. New search object and add to stat
        state.search = new Search(query);
        // 3. prepare UI for results
        searchView.clearInputs();
        searchView.clearResults();
        renderLoader(elements.searchRes);        
        try {
            
            //4.search or recipes
            await state.search.getResults();
    
            // 5. Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result)
        } catch (error) {
            alert(error);
            clearLoader();
        }
    }
}


elements.searchForm.addEventListener('submit',e=>{
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click',e => {
    const btn = e.target.closest('.btn-inline');
    if(btn){
        const goToPage = parseInt(btn.dataset.goto,10); 
        searchView.clearResults();
        searchView.renderResults(state.search.result,goToPage);
    }


});



/* RECIPE CONTROLLER
*/
const controlRecipe = async () =>{
    // Get ID from url
    const id = window.location.hash.replace('#','');
    if(id){

        // Prepare UI for the changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);
        // Highlight the selected item
        if(state.search) searchView.highlightSelected(id);
        //Create new recipe object 
        state.recipe = new Recipe(id);

        // Get recipe data 
        try {
            // get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            // Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
            // Render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe,state.likes.isLiked(id));

        } catch (error) {
            alert(error);
        }
    }
}

// window.addEventListener('hashchange',controlRecipe);
// window.addEventListener('load',controlRecipe);

['hashchange','load'].forEach(event =>window.addEventListener(event,controlRecipe));
/**
 * list controller
 */
const controlList = () =>{
    if(!state.list) state.list = new List();

    // add ing to the list and uI
    state.recipe.ingredients.forEach(el =>{
       const item = state.list.addItem(el.count, el.unit,el.ingredient);
       listView.renderItem(item);
    });
}
// Handle delete and update the item in shopping list
elements.shopping.addEventListener('click',e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;
    if(e.target.matches('.shopping__delete, .shopping__delete *')){
        // delete
        state.list.deleteItem(id);
        listView.delItem(id);
        // update the value 
    }else if(e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value);
        state.list.updateCount(id,val);
    } 
});
/**
 * LIKE CONTROLLER
 */
state.likes = new Likes();
const controlLike = () => {
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // user has not yer like current recipe
    if(!state.likes.isLiked(currentID)){
        // ADD LIKE TO THE STATE 
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
            );
        // toggle the like button 
            likesView.toggleLikeBtn(true);
        //add like to UI list
        likesView.renderLike(newLike);
    // user has not yer like current recipe
    }else{
        state.likes.deleteLike(currentID);

        likesView.toggleLikeBtn(false);

        likesView.deleteLike(currentID); 
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

// restore the liked recipes on page load
window.addEventListener('load', () =>{
    state.likes = new Like();

    state.likes.readStorage();

    likesView.toggleLikeMenu(state.likes.getNumLikes());

    state.likes.likes.forEach(like => likesView.renderLike(like));
});

// Handling recipe button clicks
elements.recipe.addEventListener('click',e =>{ 
    if(e.target.matches('.btn-decrease, .btn-decrease *')){
        if(state.recipe.servings > 1){
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    }else if(e.target.matches('.btn-increase, .btn-increase *')){
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);

    }else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        // Add ingredients to shopping list
        controlList();
    }else if (e.target.matches('.recipe__love, .recipe__love *')){
        // Like controller 
        controlLike();
    }
});


