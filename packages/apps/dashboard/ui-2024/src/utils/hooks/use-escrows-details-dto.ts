import { create } from 'zustand';

export interface EscrowDetailsDto {
	params: {
		first: number;
		skip: number;
	};
	pagination: {
		page: number;
		pageSize: number;
		lastPageIndex?: number;
	};
	setNextPage: () => void;
	setPrevPage: () => void;
	setPageSize: (pageSize: number) => void;
	setLastPageIndex: (lastPageIndex: number) => void;
}

const INITIAL_PAGE_SIZE = 10;

export const useEscrowDetailsDto = create<EscrowDetailsDto>((set) => ({
	params: {
		first: INITIAL_PAGE_SIZE,
		skip: 0,
	},
	pagination: {
		page: 0,
		pageSize: INITIAL_PAGE_SIZE,
		lastPage: false,
	},
	setNextPage() {
		set((state) => {
			const nextPage = state.pagination.page + 1;
			const newSkip = nextPage * state.params.first;

			return {
				...state,
				params: {
					...state.params,
					skip: newSkip,
				},
				pagination: {
					...state.pagination,
					page: nextPage,
				},
			};
		});
	},
	setPrevPage() {
		set((state) => {
			const prevPage =
				state.pagination.page === 0 ? 0 : state.pagination.page - 1;
			const offSetPages = prevPage === 0 ? 0 : state.pagination.page - 1;
			const newSkip = state.params.first * offSetPages;

			return {
				...state,
				params: {
					...state.params,
					skip: newSkip,
				},
				pagination: {
					...state.pagination,
					page: prevPage,
				},
			};
		});
	},
	setPageSize(pageSize: number) {
		set((state) => {
			return {
				...state,
				pagination: {
					lastPage: false,
					page: 0,
					pageSize: pageSize,
				},
				params: {
					...state.params,
					first: pageSize,
					skip: 0,
				},
			};
		});
	},
	setLastPageIndex(lastPageIndex: number) {
		set((state) => {
			return {
				...state,
				pagination: {
					...state.pagination,
					lastPageIndex,
				},
			};
		});
	},
}));
