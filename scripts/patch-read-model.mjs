import fs from 'node:fs';

const filePath = 'C:/Xandeflix/xandeflix-prebuilt-c11-main/src/catalog/catalog-read-model.ts';
let content = fs.readFileSync(filePath, 'utf8');

const target =   private buildTypedCategoryProjections(): void {
    const movieCategories: Category[] = [];
    const seriesCategories: Category[] = [];

    for (const category of this.catalog.categories) {
      const movieCount = this.moviesByCategoryId.get(category.id)?.length || 0;
      if (movieCount > 0) {
        movieCategories.push(category);
        this.typedCategoryProjectionByKey.set(\movie:\\, {
          category,
          kind: 'movie',
          itemCount: movieCount,
        });
      }

      const seriesCount = this.seriesByCategoryId.get(category.id)?.length || 0;
      if (seriesCount > 0) {
        seriesCategories.push(category);
        this.typedCategoryProjectionByKey.set(\series:\\, {
          category,
          kind: 'series',
          itemCount: seriesCount,
        });
      }
    }

    this.categoriesByKind.set('movie', movieCategories);
    this.categoriesByKind.set('series', seriesCategories);
  };

const replacement =   private isCategoryForKind(category: Category, kind: TypedCategoryKind): boolean {
    // 1. Excluir Live groups de Movies e Series para isolamento estrito de taxonomia
    if (/canais|live/i.test(category.id) || /^canais\\b|^ao vivo\\b/i.test(category.name)) {
      return false;
    }

    // 2. Proveniência explícita autoritativa
    const prov = this.categoryProvenanceById.get(category.id);
    if (prov) {
      return prov.canonicalKind === kind;
    }

    // 3. contentKinds unívoco na metadata canônica da categoria
    if (category.contentKinds && category.contentKinds.length === 1) {
      return category.contentKinds[0] === kind;
    }

    // 4. Itens materializados no first-fold
    const hasMovies = (this.moviesByCategoryId.get(category.id)?.length || 0) > 0;
    const hasSeries = (this.seriesByCategoryId.get(category.id)?.length || 0) > 0;
    if (hasMovies && !hasSeries) return kind === 'movie';
    if (hasSeries && !hasMovies) return kind === 'series';

    // 5. Recuperação canônica por metadados / taxonomia estrutural para snapshots existentes
    const isMovie = /filmes|vod|movie/i.test(category.id) || /^filmes?\\b|^vod\\b|^movie\\b/i.test(category.name);
    const isSeries = /series|novelas|programas/i.test(category.id) || /^series?\\b|^novelas?\\b|^programas?\\b/i.test(category.name);

    if (kind === 'movie') return isMovie && !isSeries;
    if (kind === 'series') return isSeries && !isMovie;

    return false;
  }

  private buildTypedCategoryProjections(): void {
    const movieCategories: Category[] = [];
    const seriesCategories: Category[] = [];

    for (const category of this.catalog.categories) {
      const isMovie = this.isCategoryForKind(category, 'movie');
      const isSeries = this.isCategoryForKind(category, 'series');

      if (isMovie) {
        movieCategories.push(category);
        const movieCount = this.moviesByCategoryId.get(category.id)?.length || 0;
        this.typedCategoryProjectionByKey.set(\movie:\\, {
          category,
          kind: 'movie',
          itemCount: movieCount,
        });
        if (!this.categoryProvenanceById.has(category.id)) {
          this.categoryProvenanceById.set(category.id, {
            categoryId: category.id,
            canonicalKind: 'movie',
          });
        }
      }

      if (isSeries) {
        seriesCategories.push(category);
        const seriesCount = this.seriesByCategoryId.get(category.id)?.length || 0;
        this.typedCategoryProjectionByKey.set(\series:\\, {
          category,
          kind: 'series',
          itemCount: seriesCount,
        });
        if (!this.categoryProvenanceById.has(category.id)) {
          this.categoryProvenanceById.set(category.id, {
            categoryId: category.id,
            canonicalKind: 'series',
          });
        }
      }
    }

    this.categoriesByKind.set('movie', movieCategories);
    this.categoriesByKind.set('series', seriesCategories);
  };

if (!content.includes(target)) {
  console.error('Target not found in catalog-read-model.ts');
  process.exit(1);
}
content = content.replace(target, replacement);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched catalog-read-model.ts');
