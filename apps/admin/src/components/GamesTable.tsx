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
  onTogglePublish: (gameId: string, published: boolean) => void;
  onEnterScore: (game: Game) => void;
  onEnableDisableBetting: (game: Game) => void;
}

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid ${colors.border};
  border-radius: 10px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
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

  tr:last-child & { border-bottom: none; }
`;

const Tr = styled.tr`
  &:hover td { background-color: ${colors.surfaceHover}; }
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

const ScoreInline = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: ${colors.text};
  margin-left: 6px;
`;

const LeagueBadge = styled.span`
  background-color: ${colors.surfaceHover};
  border: 1px solid ${colors.border};
  border-radius: 4px;
  padding: 2px 7px;
  font-size: 11px;
  color: ${colors.textMuted};
`;

const PublishBadge = styled.span<{ published: boolean }>`
  display: inline-block;
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  background-color: ${({ published }) => published ? 'rgba(34,197,94,0.15)' : colors.surfaceHover};
  color: ${({ published }) => published ? colors.success : colors.textMuted};
  border: 1px solid ${({ published }) => published ? 'rgba(34,197,94,0.3)' : colors.border};
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

  &:focus { border-color: ${colors.inputFocus}; }
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

const COLS = 7;

const GamesTable: React.FC<GamesTableProps> = ({
  games, onSetLines, onUpdateStatus, onRemove, onTogglePublish, onEnterScore, onEnableDisableBetting
}) => {
  const header = (
    <thead>
      <tr>
        <Th>Matchup</Th>
        <Th>League</Th>
        <Th>Start</Th>
        <Th>Lines</Th>
        <Th>Status</Th>
        <Th>Visibility</Th>
        <Th>Actions</Th>
      </tr>
    </thead>
  );

  if (games.length === 0) {
    return (
      <TableWrap>
        <Table>
          {header}
          <tbody>
            <EmptyRow>
              <EmptyCell colSpan={COLS}>No games yet — add one above.</EmptyCell>
            </EmptyRow>
          </tbody>
        </Table>
      </TableWrap>
    );
  }

  return (
    <TableWrap>
      <Table>
        {header}
        <tbody>
          {games.map((game) => {
            const isLive = game.status === 'live';
            const isResolving = game.status === 'resolving';
            const isFinal = game.status === 'final';
            const hasScore = game.awayScore !== undefined && game.homeScore !== undefined;

            return (
              <Tr key={game.id}>
                {/* Matchup — show score inline when resolving or final */}
                <Td>
                  <Matchup>
                    <div>
                      <AwayLabel>AWAY </AwayLabel>
                      <TeamName>{game.awayTeam}</TeamName>
                      {(isResolving || isFinal) && hasScore && (
                        <ScoreInline>{game.awayScore}</ScoreInline>
                      )}
                    </div>
                    <div>
                      <AwayLabel>HOME </AwayLabel>
                      <TeamName>{game.homeTeam}</TeamName>
                      {(isResolving || isFinal) && hasScore && (
                        <ScoreInline>{game.homeScore}</ScoreInline>
                      )}
                    </div>
                  </Matchup>
                </Td>

                {/* League */}
                <Td><LeagueBadge>{game.league}</LeagueBadge></Td>

                {/* Start time */}
                <Td style={{ whiteSpace: 'nowrap', fontSize: 12, color: colors.textMuted }}>
                  {formatTime(game.startTime)}
                </Td>

                {/* Lines */}
                <Td>
                  <OddsSummary>
                    <OddsLine>ML: {formatOdds(game.odds.moneyline.away)} / {formatOdds(game.odds.moneyline.home)}</OddsLine>
                    <OddsLine>SPR: {formatOdds(game.odds.spread.away.line)} ({formatOdds(game.odds.spread.away.juice)}) / {formatOdds(game.odds.spread.home.line)} ({formatOdds(game.odds.spread.home.juice)})</OddsLine>
                  </OddsSummary>
                </Td>

                {/* Status dropdown */}
                <Td>
                  <StatusSelect
                    value={game.status}
                    onChange={(e) => onUpdateStatus(game.id, e.target.value as GameStatus)}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="resolving">Resolving</option>
                    <option value="final">Final</option>
                  </StatusSelect>
                </Td>

                {/* Visibility */}
                <Td>
                  <PublishBadge published={game.published}>
                    {game.published ? 'Published' : 'Draft'}
                  </PublishBadge>
                </Td>

                {/* Actions */}
                <Td>
                  <ActionCell>
                    <Button
                      size="sm"
                      variant={game.published ? 'ghost' : 'primary'}
                      onClick={() => onTogglePublish(game.id, !game.published)}
                      disabled={isResolving}
                      // dont let game be disabled while resolving, can be taken down mid game if changes is needed
                    >
                      {game.published ? 'Unpublish' : 'Publish'}
                    </Button>

                    {/* Enter Score */}
                    {(isLive ||isResolving) && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onEnterScore(game)}
                      >
                        {hasScore ? 'Edit Score' : 'Enter Score'}
                      </Button>
                    )}

                    {/* Enable / Disable Betting — available for any non-final game */}
                    {!isFinal && (
                      <Button
                        size="sm"
                        variant={game.bettingEnabled ? 'primary' : 'ghost'}
                        onClick={() => onEnableDisableBetting(game)}
                      >
                        {game.bettingEnabled ? 'Enable Betting' : 'Disable Betting'}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSetLines(game)}
                      disabled={isLive || isResolving || isFinal}
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
            );
          })}
        </tbody>
      </Table>
    </TableWrap>
  );
};

export default GamesTable;
