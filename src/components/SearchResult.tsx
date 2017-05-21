import { createElement, SFC } from 'react';
import { getURL, getStopURL } from '../utils'

interface PlaceSearchResultProps {
	matched: string
	text: string
	iconClass: string
	iconStyle?: React.CSSProperties
	onClick: React.MouseEventHandler<HTMLAnchorElement>
	type: 'place'
}

interface GTFSSearchResultProps {
	matched: string
	text: string
	iconClass: string
	iconStyle?: React.CSSProperties
	id: string
	type: 'route' | 'stop'
}

type SearchResultProps = PlaceSearchResultProps | GTFSSearchResultProps;

/**
 * A single search result. Should be displayed in a list under
 * a search box
 */
const SearchResult: SFC<SearchResultProps> = props => {
	let href = '#';
	switch (props.type) {
		case 'route':
			href = getURL(props.id);
			break;
		case 'stop':
			href = getStopURL(props.id);
			break;
	}

	const text: React.ReactNode[] = [];
	const lowercase = props.text.toLowerCase();
	const match = props.matched.toLowerCase();
	let fromIndex = 0;
	while (fromIndex < props.text.length) {
		const index = lowercase.indexOf(match, fromIndex);
		text.push(props.text.slice(fromIndex, index));
		text.push(<strong>props.text.slice(index, match.length)</strong>);
	}

	return (
		<a
			className="search-result"
			onClick={props.type === 'place' ? props.onClick : undefined}
			href={href}
		>
			<i
				className={`search-result-icon ${props.iconClass}`}
				style={props.iconStyle}
			/>
			<span className="search-text">{text}</span>
		</a>
	)
}

export default SearchResult;
