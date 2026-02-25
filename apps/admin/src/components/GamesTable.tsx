import React from 'react';
import styled from 'styled-components';
import { Game, GameStatus, GameOdds } from '../types';
import { colors } from '../styles/GlobalStyles';
import Button from './Button';

interface GamesTableProps {
  games: Game[];
  onSetLines: (game: Game) => void;
  onUpdateStatus: (gameId: string, status: GameStatus) => void;
  onUpdateOdds: (gameId: string, odds: GameOdds) => void;
  onRemove: (gameId: string) => void;
}

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid ${colors.border};
  border-radius: 10px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
`;

const Th = styled.th`
  text-align: left;
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid ${colors.border};
  background-color: ${colors.surfaceHover};
  white-space: nowrap;

  &:first-child { border-radius: 10px 0 0 0; }
  &:last-child  { border-radius: 0 10px 0 0; }
`;

const Td = styled.td`
  padding: 12px 14px;
  border-bottom: 1px solid ${colors.border};
  vertical-align: middle;

  tr:last-child & {
    border-bottom: none;
  }
`;

const Tr = styled.tr`
  &:hover td {
    background-color: ${colors.surfaceHover};
  }
`;

const Matchup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TeamName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${colors.text};
`;

const AwayLabel = styled.span`
  font-size: 10px;
  color: ${colors.textMuted};
`;

const LeagueBadge = styled.span`
  background-color: ${colors.surfaceHover};
  border: 1px solid ${colors.border};
  border-radius: 4px;
  padding: 2px 7px;
  font-size: 11px;
  color: ${colors.textMuted};
`;

const StatusBadge = styled.span<{ status: GameStatus }>`
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  background-color: ${({ status }) =>
    status === 'live' ? colors.live :
    status === 'final' ? colors.surfaceHover :
    colors.surfaceHover};
  color: ${({ status }) =>
    status === 'live' ? '#fff' :
    status === 'final' ? colors.textMuted :
    colors.textMuted};
`;

const OddsSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const OddsLine = styled.span`
  font-size: 12px;
  color: ${colors.textMuted};
  font-feature-settings: 'tnum';
`;

const ActionCell = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const StatusSelect = styled.select`
  background-color: ${colors.inputBg};
  border: 1px solid ${colors.border};
  border-radius: 6px;
  color: ${colors.text};
  padding: 5px 8px;
  font-size: 12px;
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: ${colors.inputFocus};
  }

  option { background-color: ${colors.surface}; }
`;

const formatOdds = (n: number) => (n > 0 ? `+${n}` : `${n}`);

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const EmptyRow = styled.tr``;
const EmptyCell = styled.td`
  padding: 32px 14px;
  text-align: center;
  color: ${colors.textMuted};
  font-size: 13px;
`;

const GamesTable: React.FC<GamesTableProps> = ({ games, onSetLines, onUpdateStatus, onRemove }) => {
  if (games.length === 0) {
    return (
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Matchup</Th>
              <Th>League</Th>
              <Th>Start</Th>
              <Th>Lines</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            <EmptyRow>
              <EmptyCell colSpan={6}>No games yet — add one above.</EmptyCell>
            </EmptyRow>
          </tbody>
        </Table>
      </TableWrap>
    );
  }

  return (
    <TableWrap>
      <Table>
        <thead>
          <tr>
            <Th>Matchup</Th>
            <Th>League</Th>
            <Th>Start</Th>
            <Th>Lines</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <Tr key={game.id}>
              <Td>
                <Matchup>
                  <div>
                    <AwayLabel>AWAY </AwayLabel>
                    <TeamName>{game.awayTeam}</TeamName>
                  </div>
                  <div>
                    <AwayLabel>HOME </AwayLabel>
                    <TeamName>{game.homeTeam}</TeamName>
                  </div>
                </Matchup>
              </Td>

              <Td><LeagueBadge>{game.league}</LeagueBadge></Td>

              <Td style={{ whiteSpace: 'nowrap', fontSize: 12, color: colors.textMuted }}>
                {formatTime(game.startTime)}
              </Td>

              <Td>
                <OddsSummary>
                  <OddsLine>
                    ML: {formatOdds(game.odds.moneyline.away)} / {formatOdds(game.odds.moneyline.home)}
                  </OddsLine>
                  <OddsLine>
                    SPR: {formatOdds(game.odds.spread.away.line)} ({formatOdds(game.odds.spread.away.juice)}) / {formatOdds(game.odds.spread.home.line)} ({formatOdds(game.odds.spread.home.juice)})
                  </OddsLine>
                </OddsSummary>
              </Td>

              <Td>
                <StatusSelect
                  value={game.status}
                  onChange={(e) => onUpdateStatus(game.id, e.target.value as GameStatus)}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="final">Final</option>
                </StatusSelect>
              </Td>

              <Td>
                <ActionCell>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onSetLines(game)}
                    disabled={game.status === 'final'}
                  >
                    Set Lines
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => onRemove(game.id)}
                  >
                    Remove
                  </Button>
                </ActionCell>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
};

export default GamesTable;
